import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import EditClient from "./EditClient";

export default async function CommunityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireMember();
  const supabase = await createClient();

  // 수정 화면은 항상 최신 값을 직접 조회해요 (캐시 안 씀) — 그리고
  // 본인 글이 아니면 조건에 안 걸려서 조회 자체가 안 되니 그대로 404예요.
  const { data: post } = await supabase
    .from("community_posts")
    .select(
      "id,post_type,title,content,symbol,trade_count,seed_amount,profit_amount,screenshot_url"
    )
    .eq("id", id)
    .eq("author_id", profile.id)
    .maybeSingle();

  if (!post) notFound();

  return <EditClient post={post} />;
}
