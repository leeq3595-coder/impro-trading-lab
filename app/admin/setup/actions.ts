"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  usernameToAdminEmail,
  ADMIN_SETUP_SECRET,
} from "@/lib/adminAuth";
import { errorDetail } from "@/lib/errorDetail";

export type CreateAdminState = { error: string } | { ok: true } | undefined;

export async function createAdminAccount(
  _prevState: CreateAdminState,
  formData: FormData
): Promise<CreateAdminState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const nickname = String(formData.get("nickname") || "").trim();
  const setupSecret = String(formData.get("setup_secret") || "");

  if (!username || !password || !nickname || !setupSecret) {
    return { error: "모든 항목을 입력해주세요." };
  }
  if (password.length < 4) {
    return { error: "비밀번호는 4자 이상이어야 해요." };
  }
  // 생성 비밀번호가 틀리면 그 이상 아무것도 진행하지 않아요 — 이 페이지
  // 주소를 알아내도 이 값을 모르면 관리자 계정을 만들 수 없어요.
  if (setupSecret !== ADMIN_SETUP_SECRET) {
    return { error: "생성 비밀번호가 올바르지 않아요." };
  }

  const admin = createAdminClient();
  const email = usernameToAdminEmail(username);
  // 회원 페이지 등 닉네임이 노출되는 모든 곳에 "이름(관리자)"로 자동
  // 표시되게, 닉네임 자체에 접미사를 붙여서 저장해요.
  const fullNickname = `${nickname}(관리자)`;

  let created;
  try {
    const res = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nickname: fullNickname },
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
