"use server";

import { createClient } from "@/lib/supabase/server";
import { errorDetail } from "@/lib/errorDetail";

export type SignupState =
  | { error: string }
  | { ok: true; userId: string }
  | undefined;

export async function createAccount(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nickname = String(formData.get("nickname") || "").trim();
  const agreed = formData.get("agreed") === "on";

  if (!email || !password || !nickname) {
    return { error: "모든 항목을 입력해주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 해요." };
  }
  if (!agreed) {
    return { error: "약관에 동의해주세요." };
  }

  const supabase = await createClient();
  let data, error;
  try {
    ({ data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    }));
  } catch (e) {
    console.error("[signup] unexpected throw:", errorDetail(e));
    return { error: `가입 중 예외 발생: ${errorDetail(e)}` };
  }

  if (error) {
    console.error("[signup] supabase auth error:", errorDetail(error));
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { error: "이미 가입된 이메일이에요." };
    }
    if (msg.includes("rate limit")) {
      // 이미 가입(미인증) 상태인 이메일로 다시 가입하면 Supabase가 인증 메일을
      // 재발송하려다 무료 요금제 메일 발송 제한에 걸려요 — 결과적으로 "이미 가입된 이메일"인
      // 경우가 대부분이라 이렇게 안내해요.
      return {
        error:
          "이미 가입된 이메일이에요 (또는 인증 메일을 너무 자주 요청했어요). 잠시 후 다시 시도하거나 로그인을 이용해주세요.",
      };
    }
    return {
      error: `가입 중 오류가 발생했어요: ${error.message} — 상세: ${errorDetail(
        error
      )}`,
    };
  }
  if (!data.user) {
    return { error: "가입 중 오류가 발생했어요. 다시 시도해주세요." };
  }

  // 이미 가입(이메일 인증 완료)된 계정으로 재가입 시도하면 Supabase는 에러 대신
  // "성공"처럼 응답하되 identities를 빈 배열로 줘요 (이메일 존재 여부 추측 방지용 보안 설계).
  // 이 경우도 "이미 가입된 이메일"로 안내해줘야 해요.
  if (data.user.identities && data.user.identities.length === 0) {
    return { error: "이미 가입된 이메일이에요." };
  }

  // Supabase 대시보드에서 "Confirm email"을 꺼뒀기 때문에 이메일 인증 없이 바로 가입 완료돼요.
  // (휴대폰 인증이 실제 본인확인 역할을 해요)

  // signUp()이 세션까지 만들어주는 경우도 있지만, 프로젝트 설정에 따라 세션 없이
  // user만 돌아오는 경우도 있어서 — 가입 직후 자동 로그인이 확실히 되도록 여기서
  // 한 번 더 로그인을 시도해요. (같은 supabase 클라이언트라 성공하면 쿠키가 바로 저장돼요)
  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error(
        "[signup] auto sign-in after signup failed:",
        errorDetail(signInError)
      );
    }
  } catch (e) {
    console.error("[signup] auto sign-in unexpected throw:", errorDetail(e));
  }

  return { ok: true, userId: data.user.id };
}
