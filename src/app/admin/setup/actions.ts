"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { usernameToAdminEmail } from "@/lib/adminAuth";
import { errorDetail } from "@/lib/errorDetail";

export type BootstrapState = { error: string } | { ok: true } | undefined;

export async function bootstrapAdmin(
  _prevState: BootstrapState,
  formData: FormData
): Promise<BootstrapState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "아이디와 비밀번호를 입력해주세요." };
  }
  if (password.length < 4) {
    return { error: "비밀번호는 4자 이상이어야 해요." };
  }

  const admin = createAdminClient();

  // 이미 관리자 계정이 하나라도 있으면 더 이상 만들지 못하게 막아요.
  // (이 setup 페이지는 최초 1회만 쓰고, 그 이후엔 자동으로 잠겨요)
  const { count, error: countError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (countError) {
    console.error("[admin setup] count error:", errorDetail(countError));
    return { error: `확인 중 오류가 발생했어요: ${errorDetail(countError)}` };
  }
  if ((count ?? 0) > 0) {
    return {
      error:
        "이미 관리자 계정이 만들어져 있어요. 보안을 위해 이 페이지는 더 이상 사용할 수 없어요.",
    };
  }

  const email = usernameToAdminEmail(username);

  let created;
  try {
    const res = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nickname: `관리자(${username})` },
    });
    if (res.error) throw res.error;
    created = res.data;
  } catch (e) {
    console.error("[admin setup] createUser error:", errorDetail(e));
    return { error: `계정 생성 중 오류가 발생했어요: ${errorDetail(e)}` };
  }

  if (!created.user) {
    return { error: "계정 생성에 실패했어요." };
  }

  // handle_new_user 트리거가 profiles 행을 자동으로 만들어주는데, role은 기본값 'member'예요.
  // 여기서 admin으로 승격해요.
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", created.user.id);

  if (roleError) {
    console.error("[admin setup] role update error:", errorDetail(roleError));
    return {
      error: `계정은 만들어졌지만 관리자 권한 설정에 실패했어요: ${errorDetail(
        roleError
      )}`,
    };
  }

  return { ok: true };
}
