"use server";

import { requireAdmin } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/server";
import { usernameToMemberEmail } from "@/lib/adminAuth";
import { errorDetail } from "@/lib/errorDetail";

export type CreateMemberState =
  | { error: string }
  | { ok: true; email: string }
  | undefined;

// 관리자가 (가라회원/지인용으로) 아이디·비번·닉네임·VIP여부만 받아서
// 바로 로그인 가능한 회원 계정을 만들어줘요. 휴대폰 인증 없이 바로
// 생성되니까, 나중에 문자인증이 켜져도(한 번호당 계정 1개 제한) 이걸로
// 미리 여러 개 만들어둘 수 있어요.
export async function createMember(
  _prevState: CreateMemberState,
  formData: FormData
): Promise<CreateMemberState> {
  await requireAdmin();

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const nickname = String(formData.get("nickname") || "").trim();
  const isVip = formData.get("is_vip") === "on";

  if (!username || !password || !nickname) {
    return { error: "아이디, 비밀번호, 닉네임을 모두 입력해주세요." };
  }
  if (password.length < 4) {
    return { error: "비밀번호는 4자 이상이어야 해요." };
  }

  const admin = createAdminClient();
  // "아이디"란에 그냥 "친구1" 같은 걸 넣으면 내부용 가짜 이메일로
  // 자동 변환하고, "@"가 들어간 진짜 이메일(gmail·naver 등)을 넣으면
  // 그 이메일을 그대로 로그인 계정으로 써요. 실제 이메일은 인증메일이
  // 안 가니까(email_confirm:true) 받은사람이 실제로 그 메일함을 쓸
  // 필요는 없지만, 한 이메일당 계정을 1개만 만들 수 있어요 — 여러 개
  // 만드실 거면 그냥 아이디(친구1, 친구2...)로 만드는 게 훨씬 편해요.
  const email = username.includes("@")
    ? username.toLowerCase()
    : usernameToMemberEmail(username);

  let created;
  try {
    const res = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nickname },
    });
    if (res.error) throw res.error;
    created = res.data;
  } catch (e) {
    console.error("[admin create-member] createUser error:", errorDetail(e));
    return { error: `계정 생성 중 오류가 발생했어요: ${errorDetail(e)}` };
  }

  if (!created.user) {
    return { error: "계정 생성에 실패했어요." };
  }

  if (isVip) {
    const { error: vipError } = await admin
      .from("profiles")
      .update({ is_vip: true, vip_since: new Date().toISOString() })
      .eq("id", created.user.id);
    if (vipError) {
      console.error("[admin create-member] vip update error:", errorDetail(vipError));
      return {
        error: `계정은 만들어졌지만 VIP 설정에 실패했어요: ${errorDetail(vipError)}`,
      };
    }
  }

  return { ok: true, email };
}

export async function deleteMember(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { error: "본인 관리자 계정은 여기서 삭제할 수 없어요." };
  }

  const supabase = createAdminClient();
  // auth.users 삭제 → profiles가 on delete cascade로 함께 삭제되고
  // 그 회원이 작성한 게시글/댓글/좋아요/스크랩/포인트내역도 cascade로 정리돼요.
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return { error: `삭제 중 오류가 발생했어요: ${error.message}` };
  }
  return { ok: true };
}
