"use server";

import { requireAdmin } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/server";

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
