"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { requireMember } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { errorDetail } from "@/lib/errorDetail";

export type WriteState = { error: string } | undefined;

export async function createCommunityPost(
  _prevState: WriteState,
  formData: FormData
): Promise<WriteState> {
  const profile = await requireMember();
  const postType = String(formData.get("post_type") || "");
  const supabase = await createClient();

  let newId: string;

  if (postType === "profit_proof") {
    const symbol = String(formData.get("symbol") || "").trim();
    const seedAmount = Number(formData.get("seed_amount") || 0);
    const profitAmount = Number(formData.get("profit_amount") || 0);
    const tradeCount = Number(formData.get("trade_count") || 0);
    const screenshotUrl = String(formData.get("screenshot_url") || "").trim();
    const content = String(formData.get("content") || "").trim();

    if (!symbol || !seedAmount || !profitAmount) {
      return { error: "종목, 시드금액, 수익금액을 입력해주세요." };
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        post_type: "profit_proof" as const,
        author_id: profile.id,
        symbol,
        seed_amount: seedAmount,
        profit_amount: profitAmount,
        trade_count: tradeCount || 0,
        screenshot_url: screenshotUrl || null,
        content: content || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[community write] insert error:", errorDetail(error));
      return { error: `등록 중 오류가 발생했어요: ${errorDetail(error)}` };
    }
    newId = data.id;
  } else if (postType === "strategy_share") {
    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();

    if (!title || !content) {
      return { error: "제목과 내용을 입력해주세요." };
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        post_type: "strategy_share" as const,
        author_id: profile.id,
        title,
        content,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[community write] insert error:", errorDetail(error));
      return { error: `등록 중 오류가 발생했어요: ${errorDetail(error)}` };
    }
    newId = data.id;
  } else {
    return { error: "게시글 종류를 선택해주세요." };
  }

  // 포인트 적립 (실패해도 글 등록 자체는 이미 성공했으니 에러로 막지 않고 로그만 남겨요)
  const { error: pointsError } = await supabase.rpc("award_post_points", {
    p_post_type: postType,
    p_ref_id: newId,
  });
  if (pointsError) {
    console.error("[community write] points error:", errorDetail(pointsError));
  }

  // 새 글이 홈/커뮤니티 목록 캐시에 바로 반영되게 해요.
  revalidateTag("public-community-posts", { expire: 0 });

  redirect(`/community/${newId}`);
}

// 내가 쓴 글 수정. post_type은 글쓰기 화면과 똑같은 필드 구성이라
// createCommunityPost랑 거의 같은 형태예요 — 다만 새로 만들지 않고
// 기존 글(본인 글만) 위에 덮어써요.
export async function updateCommunityPost(
  postId: string,
  _prevState: WriteState,
  formData: FormData
): Promise<WriteState> {
  const profile = await requireMember();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("community_posts")
    .select("id,post_type,author_id")
    .eq("id", postId)
    .maybeSingle();

  // RLS가 어차피 막아주지만, 에러 메시지를 더 명확하게 보여주려고 먼저 확인해요.
  if (!existing || existing.author_id !== profile.id) {
    return { error: "본인이 쓴 글만 수정할 수 있어요." };
  }

  if (existing.post_type === "profit_proof") {
    const symbol = String(formData.get("symbol") || "").trim();
    const seedAmount = Number(formData.get("seed_amount") || 0);
    const profitAmount = Number(formData.get("profit_amount") || 0);
    const tradeCount = Number(formData.get("trade_count") || 0);
    const screenshotUrl = String(formData.get("screenshot_url") || "").trim();
    const content = String(formData.get("content") || "").trim();

    if (!symbol || !seedAmount || !profitAmount) {
      return { error: "종목, 시드금액, 수익금액을 입력해주세요." };
    }

    const { error } = await supabase
      .from("community_posts")
      .update({
        symbol,
        seed_amount: seedAmount,
        profit_amount: profitAmount,
        trade_count: tradeCount || 0,
        screenshot_url: screenshotUrl || null,
        content: content || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("author_id", profile.id);

    if (error) {
      console.error("[community update] error:", errorDetail(error));
      return { error: `수정 중 오류가 발생했어요: ${errorDetail(error)}` };
    }
  } else {
    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();

    if (!title || !content) {
      return { error: "제목과 내용을 입력해주세요." };
    }

    const { error } = await supabase
      .from("community_posts")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", postId)
      .eq("author_id", profile.id);

    if (error) {
      console.error("[community update] error:", errorDetail(error));
      return { error: `수정 중 오류가 발생했어요: ${errorDetail(error)}` };
    }
  }

  revalidateTag("public-community-posts", { expire: 0 });
  revalidateTag("public-community-post-by-id", { expire: 0 });

  redirect(`/community/${postId}`);
}

// 내가 쓴 글 삭제. RLS(posts_delete_own_or_admin)가 실제 보안 경계라
// author_id 조건이 없어도 안전하지만, 남의 글 삭제 시도를 명확한
// 에러로 걸러내려고 조건을 같이 걸어요.
export async function deleteCommunityPost(
  postId: string
): Promise<{ error?: string }> {
  const profile = await requireMember();
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", profile.id);

  if (error) {
    console.error("[community delete] error:", errorDetail(error));
    return { error: `삭제 중 오류가 발생했어요: ${errorDetail(error)}` };
  }

  revalidateTag("public-community-posts", { expire: 0 });
  revalidateTag("public-community-post-by-id", { expire: 0 });

  return {};
}
