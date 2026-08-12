"use server";

import { createClient } from "@/lib/supabase/server";

export type SignupState =
  | { error: string }
  | { ok: true; userId: string; needsEmailConfirm: boolean }
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "이미 가입된 이메일이에요." };
    }
    return { error: `가입 중 오류가 발생했어요: ${error.message}` };
  }
  if (!data.user) {
    return { error: "가입 중 오류가 발생했어요. 다시 시도해주세요." };
  }

  // Supabase 프로젝트의 "Confirm email" 설정이 켜져 있으면 session이 없어요(이메일 인증 필요)
  return { ok: true, userId: data.user.id, needsEmailConfirm: !data.session };
}
