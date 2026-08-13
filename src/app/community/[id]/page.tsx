import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { getCommunityPostById } from "@/lib/publicData";
import { excerptFromContent } from "@/lib/ogText";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";
import { LikeButton } from "@/components/LikeButton";
import { PostOwnerActions } from "@/components/community/PostOwnerActions";
import { CommentsSection, type CommentItem } from "@/components/CommentsSection";
import { RichContent } from "@/components/RichContent";
import { SafeThumb } from "@/components/SafeThumb";

export const revalidate = 0;

// 카카오톡 등에 수익인증/매매법공유 링크를 공유했을 때 뜨는 미리보기예요.
// 수익인증은 종목·수익률을 제목에 바로 노출해서 "얼마나 벌었길래?" 하는
// 궁금증을 자극하고, 스크린샷을 미리보기 이미지로 써요. 매매법공유는
// 회원 전용이라 잠금 느낌을 살짝 섞어요.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getCommunityPostById(id);
  if (!post) return {};

  const isProfitProof = post.post_type === "profit_proof";

  let title: string;
  if (isProfitProof) {
    const rate = post.profit_rate != null ? `+${post.profit_rate}%` : "수익";
    const symbol = post.symbol ? `[${post.symbol}] ` : "";
    title = `🔥 ${symbol}${rate} 수익인증 - 임프로트레이딩랩`;
  } else {
    title = post.title
      ? `📘 ${post.title} - 임프로트레이딩랩`
      : "📘 매매법공유 - 임프로트레이딩랩";
  }

  const description = post.content
    ? excerptFromContent(post.content)
    : "임프로트레이딩랩 커뮤니티에서 확인해보세요.";

  const image =
    (post.screenshot_urls && post.screenshot_urls[0]) ||
    post.screenshot_url ||
    "/profile-logo.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/community/${id}`,
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

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

  if (post.post_type === "strategy_share" && !loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
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

  // 작성자 닉네임 / 좋아요 여부 / 댓글 목록은 서로 관계없는 요청이라
  // 한꺼번에 보내요. 비로그인이면 좋아요 여부 조회는 건너뛰어요.
  const [authorResult, likeResult, commentsResult] = await Promise.all([
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
  ]);

  let authorNickname = "회원";
  if (authorResult.data) authorNickname = authorResult.data.nickname;

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
            return (
              <div
                className={`mb-4 grid gap-2 ${
                  images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                {images.map((src, i) => (
                  <SafeThumb
                    key={src + i}
                    src={src}
                    alt={`인증 스크린샷 ${i + 1}`}
                    className="aspect-square w-full rounded-xl border border-[rgba(96,150,255,0.16)] object-cover"
                  />
                ))}
              </div>
            );
          })()}

        {post.content && <RichContent content={post.content} />}

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
