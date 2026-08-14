import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { getCommunityPostById, getAllLinkSettings } from "@/lib/publicData";
import { excerptFromContent, toAbsoluteUrl, SITE_URL } from "@/lib/ogText";
import { OgTags } from "@/components/OgTags";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";
import { ExchangeSignupBanner } from "@/components/ExchangeSignupBanner";
import { LikeButton } from "@/components/LikeButton";
import { PostOwnerActions } from "@/components/community/PostOwnerActions";
import { CommentsSection, type CommentItem } from "@/components/CommentsSection";
import { RichContent } from "@/components/RichContent";
import { SafeThumb } from "@/components/SafeThumb";

export const revalidate = 0;

// (예전엔 여기 generateMetadata가 있었는데, 이 배포 환경에서 실행 자체가
// 안 되는 게 확인돼서 제거했어요. 카톡 미리보기 태그는 이제 공용 OgTags로
// 페이지 컴포넌트 안에서 직접 렌더링해요. — src/components/OgTags.tsx)

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 로그인 확인이랑 게시글 조회는 서로 관계없는 요청이라 동시에 보내요.
  // 게시글 조회 자체는 캐시된 공개 데이터라 대부분 DB를 다시 안 맞고 바로
  // 나가요.
  const [profile, post] = await Promise.all([
    getCurrentProfile(),
    getCommunityPostById(id),
  ]);
  const loggedIn = !!profile;

  if (!post) notFound();

  const isProfitProofOg = post.post_type === "profit_proof";
  let ogTitle: string;
  if (isProfitProofOg) {
    const rate = post.profit_rate != null ? `+${post.profit_rate}%` : "수익";
    const symbol = post.symbol ? `[${post.symbol}] ` : "";
    ogTitle = `🔥 ${symbol}${rate} 수익인증 - 임프로트레이딩랩`;
  } else {
    ogTitle = post.title
      ? `📘 ${post.title} - 임프로트레이딩랩`
      : "📘 매매법공유 - 임프로트레이딩랩";
  }
  const ogDescription = post.content
    ? excerptFromContent(post.content)
    : "임프로트레이딩랩 커뮤니티에서 확인해보세요.";
  const ogRawImage =
    (post.screenshot_urls && post.screenshot_urls[0]) ||
    post.screenshot_url ||
    null;
  const ogImage = toAbsoluteUrl(ogRawImage);
  const ogUrl = `${SITE_URL}/community/${id}`;
  const ogTags = (
    <OgTags title={ogTitle} description={ogDescription} image={ogImage} url={ogUrl} />
  );

  if (post.post_type === "strategy_share" && !loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        {ogTags}
        <AutoGate message="매매법공유는 회원만 볼 수 있어요. 간편가입하고 확인해보세요." />
        <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
          <Link href="/community" className="text-sm text-[#93a0b8]">
            ← 커뮤니티
          </Link>
        </header>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#3b82f6] text-2xl">
            🔒
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            매매법공유는 회원 전용이에요
          </h1>
          <p className="mb-6 text-sm text-[#93a0b8]">
            간편가입하고 다른 회원들의 매매법을 확인해보세요.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-6 py-3 font-bold text-[#04101f]"
          >
            간편가입하기
          </Link>
        </div>
        <BottomNav loggedIn={loggedIn} />
      </main>
    );
  }

  // 작성자 닉네임 / 좋아요 여부 / 댓글 목록 / 거래소 가입 배너 링크는 서로
  // 관계없는 요청이라 한꺼번에 보내요. 비로그인이면 좋아요 여부 조회는
  // 건너뛰어요. 링크는 캐시된 공개 데이터라 대부분 DB를 다시 안 맞고 바로
  // 나가요.
  const [authorResult, likeResult, commentsResult, links] = await Promise.all([
    supabase
      .from("public_profiles")
      .select("nickname")
      .eq("id", post.author_id)
      .maybeSingle(),
    profile
      ? supabase
          .from("likes")
          .select("id")
          .eq("parent_type", "community_post")
          .eq("parent_id", id)
          .eq("user_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null as { id: string } | null }),
    supabase
      .from("comments")
      .select("id,author_id,content,created_at")
      .eq("parent_type", "community_post")
      .eq("parent_id", id)
      .order("created_at", { ascending: true }),
    getAllLinkSettings(),
  ]);

  let authorNickname = "회원";
  if (authorResult.data) authorNickname = authorResult.data.nickname;

  // 커뮤니티(수익인증/매매법공유) 글 맨 끝에 항상 고정으로 붙는 거래소 가입
  // 배너 — 링크는 홈 화면 1번 배너(banner1_signup)랑 같은 걸 써요. 관리자에서
  // 그 링크 하나만 바꾸면 홈이랑 여기 둘 다 같이 바뀌어요.
  const signupUrl =
    links.find((l) => l.link_key === "banner1_signup")?.url || "/signup";

  const dateLabel = new Date(post.created_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".");

  const liked = !!likeResult.data;
  const { data: commentRows } = commentsResult;

  const commentAuthorIds = Array.from(
    new Set((commentRows ?? []).map((c) => c.author_id))
  );
  let commentNicknameById = new Map<string, string>();
  if (commentAuthorIds.length > 0) {
    const { data: commentAuthors } = await supabase
      .from("public_profiles")
      .select("id,nickname")
      .in("id", commentAuthorIds);
    commentNicknameById = new Map(
      (commentAuthors ?? []).map((a) => [a.id, a.nickname])
    );
  }
  const comments: CommentItem[] = (commentRows ?? []).map((c) => ({
    id: c.id,
    author_id: c.author_id,
    authorNickname: commentNicknameById.get(c.author_id) ?? "회원",
    content: c.content,
    created_at: c.created_at,
  }));

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      {ogTags}
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <Link href="/community" className="text-sm text-[#93a0b8]">
          ← 커뮤니티
        </Link>
      </header>
      <article className="mx-auto max-w-md px-4 pb-6 pt-[68px]">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {post.is_pinned && (
            <span className="inline-block rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
              📌 고정
            </span>
          )}
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
              post.post_type === "profit_proof"
                ? "bg-[rgba(232,120,75,0.16)] text-[#f6a97e]"
                : "bg-[rgba(96,150,255,0.16)] text-[#8fb3ff]"
            }`}
          >
            {post.post_type === "profit_proof" ? "🔥 수익인증" : "📘 매매법공유"}
          </span>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-[#243352]" />
          <div>
            <div className="text-sm font-bold text-white">
              {authorNickname}
            </div>
            <div className="text-[11px] text-[#5f6b82]">{dateLabel}</div>
          </div>
        </div>

        {profile?.id === post.author_id && (
          <PostOwnerActions postId={post.id} />
        )}

        {post.title && (
          <h1 className="mb-3 text-lg font-bold text-white">{post.title}</h1>
        )}

        {post.post_type === "profit_proof" && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatBox label="종목" value={post.symbol ?? "-"} />
            <StatBox
              label="수익률"
              value={post.profit_rate != null ? `+${post.profit_rate}%` : "-"}
              highlight
            />
            <StatBox label="매매횟수" value={`${post.trade_count ?? 0}회`} />
          </div>
        )}

        {post.post_type === "profit_proof" &&
          (() => {
            const images =
              post.screenshot_urls && post.screenshot_urls.length > 0
                ? post.screenshot_urls
                : post.screenshot_url
                  ? [post.screenshot_url]
                  : [];
            if (images.length === 0) return null;
            // ⚠️ 예전엔 aspect-square + object-cover로 무조건 정사각형으로
            // 잘라서 보여줬는데, 거래소 화면 캡처처럼 가로로 긴 스크린샷은
            // 양옆이 심하게 잘려나가서 사진이 제대로 안 보였어요. 원본 비율
            // 그대로(자르지 않고) 보여주도록 바꿨어요.
            return (
              <div className="mb-4 flex flex-col gap-2">
                {images.map((src, i) => (
                  <SafeThumb
                    key={src + i}
                    src={src}
                    alt={`인증 스크린샷 ${i + 1}`}
                    className="w-full rounded-xl border border-[rgba(96,150,255,0.16)]"
                  />
                ))}
              </div>
            );
          })()}

        {post.content && <RichContent content={post.content} />}

        <ExchangeSignupBanner href={signupUrl} />

        <div className="mt-6 flex items-center gap-3">
          <LikeButton
            postId={post.id}
            userId={profile?.id ?? null}
            initialLiked={liked}
            initialCount={post.likes_count + (post.likes_boost ?? 0)}
          />
          <span className="text-sm text-[#93a0b8]">💬 {post.comments_count}</span>
        </div>

        <CommentsSection
          parentType="community_post"
          parentId={post.id}
          path={`/community/${post.id}`}
          loggedIn={loggedIn}
          currentUserId={profile?.id ?? null}
          comments={comments}
        />
      </article>
      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-3 text-center">
      <div className="mb-0.5 text-[10px] text-[#5f6b82]">{label}</div>
      <div
        className={`text-sm font-bold ${
          highlight ? "text-[#4ade80]" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
