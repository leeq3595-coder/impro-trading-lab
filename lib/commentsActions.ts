"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { errorDetail } from "@/lib/errorDetail";

export type CommentActionResult = { error: string } | { ok: true };

export async function postComment(
  parentType: "column" | "community_post",
  parentId: string,
  content: string,
  revalidateTo: string
): Promise<CommentActionResult> {
  const profile = await requireMember();
  const trimmed = content.trim();
  if (!trimmed) return { error: "댓글 내용을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    parent_type: parentType,
    parent_id: parentId,
    author_id: profile.id,
    content: trimmed,
  });
  if (error) {
    console.error("[comments] insert error:", errorDetail(error));
    return { error: `등록 실패: ${errorDetail(error)}` };
  }
  revalidatePath(revalidateTo);
  return { ok: true };
}

export async function deleteComment(
  commentId: string,
  revalidateTo: string
): Promise<CommentActionResult> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) {
    console.error("[comments] delete error:", errorDetail(error));
    return { error: `삭제 실패: ${errorDetail(error)}` };
  }
  revalidatePath(revalidateTo);
  return { ok: true };
}
