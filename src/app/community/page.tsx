import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { BottomNav } from "@/components/BottomNav";
import { GatedLink } from "@/components/GatedLink";
import { CommunityTabs, type CommunityPostCard } from "@/components/CommunityTabs";

export const revalidate = 0;

type PostRow = {
  id: string;
  post_type: "profit_proof" | "strategy_share";
  author_id: string;
  content: string | null;
  screenshot_url: string | null;
  profit_rate: number | null;
  likes_count: number;
  likes_boost: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toISOString().slice(5, 10).replace("-", ".");
}

export default async function CommunityPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const loggedIn = !!profile;

  const { data: profitRows } = await supabase
    .from("community_posts")
    .select(
      "id,post_type,author_id,content,screenshot_url,profit_rate,likes_count,likes_boost,comments_count,is_pinned,created_at"
    )
    .eq("post_type", "profit_proof")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<PostRow[]>();

  let strategyRows: PostRow[] | null = null;
  if (loggedIn) {
    const { data } = await supabase
      .from("community_posts")
      .select(
        "id,post_type,author_id,content,screenshot_url,profit_rate,likes_count,likes_boost,comments_count,is_pinned,created_at"
      )
      .eq("post_type", "strategy_share")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<PostRow[]>();
    strategyRows = data ?? [];
  }

  const authorIds = Array.from(
    new Set([
      ...(profitRows ?? []).map((p) => p.author_id),
      ...(strategyRows ?? []).map((p) => p.author_id),
    ])
  );
  let nicknameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("public_profiles")
      .select("id,nickname")
      .in("id", authorIds);
    nicknameById = new Map((authors ?? []).map((a) => [a.id, a.nickname]));
  }

  function toCard(p: PostRow): CommunityPostCard {
    return {
      id: p.id,
      post_type: p.post_type,
      authorNickname: nicknameById.get(p.author_id) ?? "회원",
      content: p.content,
      screenshot_url: p.screenshot_url,
      profit_rate: p.profit_rate,
      likes_count: p.likes_count + (p.likes_boost ?? 0),
      comments_count: p.comments_count,
      is_pinned: p.is_pinned,
      timeLabel: timeAgo(p.created_at),
    };
  }

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] flex items-center justify-between border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <h1 className="text-base font-bold text-white">커뮤니티</h1>
        <GatedLink
          href="/community/write"
          loggedIn={loggedIn}
          message="글쓰기는 로그인 후 이용할 수 있어요."
          className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-3 py-1.5 text-xs font-bold text-[#04101f]"
        >
          ✏️ 글쓰기
        </GatedLink>
      </header>

      <div className="mx-auto max-w-md px-4 pt-[68px]">
        <CommunityTabs
          loggedIn={loggedIn}
          profitPosts={(profitRows ?? []).map(toCard)}
          strategyPosts={strategyRows ? strategyRows.map(toCard) : null}
        />
      </div>

      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
