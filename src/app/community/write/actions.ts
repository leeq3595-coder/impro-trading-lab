"use server";

import { redirect } from "next/navigation";
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

  redirect(`/community/${newId}`);
}
