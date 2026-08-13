import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { getAllCommunityPosts, type PublicCommunityPost } from "@/lib/publicData";
import { BottomNav } from "@/components/BottomNav";
import { GatedLink } from "@/components/GatedLink";
import { CommunityTabs, type CommunityPostCard } from "@/components/CommunityTabs";

export const revalidate = 0;

type PostRow = PublicCommunityPost;

function sortPosts(rows: PostRow[]) {
  return [...rows].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

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

  // 로그인 확인이랑 게시글 목록 조회는 서로 관계없는 요청이라 동시에 보내요.
  // 게시글 목록 자체는 캐시된 공개 데이터(수익인증+매매법공유 전부)라 대부분
  // DB를 다시 안 맞고 바로 나가요 — 탭별 필터링/정렬은 여기서 메모리로 해요.
  const [profile, allPostsRaw] = await Promise.all([
    getCurrentProfile(),
    getAllCommunityPosts(),
  ]);
  const loggedIn = !!profile;

  const profitRows = sortPosts(
    allPostsRaw.filter((p) => p.post_type === "profit_proof")
  );

  let strategyRows: PostRow[] | null = null;
  if (loggedIn) {
    strategyRows = sortPosts(
      allPostsRaw.filter((p) => p.post_type === "strategy_share")
    );
  }

  // 전체보기 탭 — 수익인증 + 매매법공유를 합쳐서 고정글 우선, 그다음 최신순으로 보여줘요.
  // (비로그인이면 매매법공유는 원래 못 보니까 수익인증만 있는 profitRows를 그대로 써요)
  const allRows: PostRow[] = loggedIn ? sortPosts(allPostsRaw) : profitRows;

  const authorIds = Array.from(
    new Set([
      ...(profitRows ?? []).map((p) => p.author_id),
      ...(strategyRows ?? []).map((p) => p.author_id),
      ...allRows.map((p) => p.author_id),
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
          allPosts={allRows.map(toCard)}
          profitPosts={(profitRows ?? []).map(toCard)}
          strategyPosts={strategyRows ? strategyRows.map(toCard) : null}
        />
      </div>

      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
