import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";
import { RichContent } from "@/components/RichContent";
import { ScrapButton } from "@/components/ScrapButton";
import { CommentsSection, type CommentItem } from "@/components/CommentsSection";
import { SafeThumb } from "@/components/SafeThumb";
import Link from "next/link";

export const revalidate = 0;

export default async function ColumnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const loggedIn = !!profile;

  const { data: column } = await supabase
    .from("columns")
    .select(
      "id,title,category,is_vip,is_hidden,content,cover_image_url,author_id,published_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!column) notFound();

  const isLanding = column.is_hidden;

  let authorNickname = "임쁘로";
  const { data: author } = await supabase
    .from("public_profiles")
    .select("nickname")
    .eq("id", column.author_id)
    .maybeSingle();
  if (author) authorNickname = author.nickname;

  const dateLabel = new Date(column.published_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".");

  let communityUrl = "/signup";
  if (isLanding) {
    const { data: links } = await supabase
      .from("link_settings")
      .select("link_key,url")
      .in("link_key", ["community_chat", "vip_signal_telegram"]);
    const byKey = new Map((links ?? []).map((l) => [l.link_key, l.url]));
    communityUrl =
      byKey.get("community_chat") ||
      byKey.get("vip_signal_telegram") ||
      "/signup";
  }

  // 비로그인 상태에서 VIP 칼럼 직접 접근 → 가입유도 팝업 + 잠금 화면
  if (column.is_vip && !loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        <AutoGate message="VIP 칼럼은 회원만 볼 수 있어요. 간편가입하고 바로 확인해보세요." />
        {!isLanding && (
          <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
            <Link href="/columns" className="text-sm text-[#93a0b8]">
              ← 칼럼
            </Link>
          </header>
        )}
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6d888] to-[#e8b94b] text-2xl">
            🔒
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            VIP 전용 칼럼이에요
          </h1>
          <p className="mb-6 text-sm text-[#93a0b8]">
            간편가입하고 VIP 칼럼을 바로 확인해보세요.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-6 py-3 font-bold text-[#04101f]"
          >
            간편가입하기
          </Link>
        </div>
        {!isLanding && <BottomNav loggedIn={loggedIn} />}
      </main>
    );
  }

  // 로그인은 했지만 VIP 회원이 아닌 경우
  if (column.is_vip && loggedIn && !profile?.is_vip) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        {!isLanding && (
          <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
            <Link href="/columns" className="text-sm text-[#93a0b8]">
              ← 칼럼
            </Link>
          </header>
        )}
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6d888] to-[#e8b94b] text-2xl">
            🔒
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            VIP 전용 칼럼이에요
          </h1>
          <p className="mb-6 text-sm text-[#93a0b8]">
            올림프트레이드 가입 후 관리자 확인이 완료되면
            <br />
            VIP 칼럼이 자동으로 열려요.
          </p>
          <Link
            href="/my"
            className="inline-block rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-6 py-3 font-bold text-[#04101f]"
          >
            마이페이지에서 확인하기
          </Link>
        </div>
        {!isLanding && <BottomNav loggedIn={loggedIn} />}
      </main>
    );
  }

  if (isLanding) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-28">
        <header className="flex items-center justify-center border-b border-[rgba(96,150,255,0.1)] px-4 py-3">
          <span className="text-sm font-bold text-white">
            임프로<span className="text-[#38bdf8]">트레이딩랩</span>
          </span>
        </header>
        <article className="mx-auto max-w-md px-5 py-7">
          <span className="mb-3 inline-block rounded-full bg-[rgba(96,150,255,0.14)] px-2.5 py-1 text-[11px] font-bold text-[#8fb3ff]">
            {column.category}
          </span>
          <h1 className="mb-3 text-2xl font-bold leading-snug text-white">
            {column.title}
          </h1>
          <div className="mb-5 flex items-center gap-2 text-xs text-[#5f6b82]">
            <span className="h-6 w-6 rounded-full bg-[#243352]" />
            {authorNickname} · {dateLabel}
          </div>
          <SafeThumb
            src={column.cover_image_url}
            className="mb-6 w-full rounded-xl border border-[rgba(96,150,255,0.16)]"
          />
          <RichContent content={column.content} />
        </article>

        {/* 하단 고정 CTA 영역 */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(96,150,255,0.16)] bg-[#070b16]/97 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-md gap-2">
            <Link
              href="/columns"
              className="flex-1 rounded-xl border border-[rgba(96,150,255,0.3)] py-3 text-center text-sm font-bold text-[#c9d3e6]"
            >
              다음 칼럼 읽기
            </Link>
            <a
              href={communityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-[1.4] rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 text-center text-sm font-bold text-[#04101f]"
            >
              공식 소통방 입장하기 →
            </a>
          </div>
        </div>
      </main>
    );
  }

  let scrapped = false;
  if (profile) {
    const { data: scrapRow } = await supabase
      .from("scraps")
      .select("id")
      .eq("column_id", column.id)
      .eq("user_id", profile.id)
      .maybeSingle();
    scrapped = !!scrapRow;
  }

  const { data: columnCommentRows } = await supabase
    .from("comments")
    .select("id,author_id,content,created_at")
    .eq("parent_type", "column")
    .eq("parent_id", column.id)
    .order("created_at", { ascending: true });

  const columnCommentAuthorIds = Array.from(
    new Set((columnCommentRows ?? []).map((c) => c.author_id))
  );
  let columnCommentNicknameById = new Map<string, string>();
  if (columnCommentAuthorIds.length > 0) {
    const { data: commentAuthors } = await supabase
      .from("public_profiles")
      .select("id,nickname")
      .in("id", columnCommentAuthorIds);
    columnCommentNicknameById = new Map(
      (commentAuthors ?? []).map((a) => [a.id, a.nickname])
    );
  }
  const columnComments: CommentItem[] = (columnCommentRows ?? []).map((c) => ({
    id: c.id,
    author_id: c.author_id,
    authorNickname: columnCommentNicknameById.get(c.author_id) ?? "회원",
    content: c.content,
    created_at: c.created_at,
  }));

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <Link href="/columns" className="text-sm text-[#93a0b8]">
          ← 칼럼
        </Link>
      </header>
      <article className="mx-auto max-w-md px-4 pb-6 pt-[68px]">
        <div className="mb-2 flex items-start justify-between gap-3">
          <span className="inline-block rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
            {column.category}
          </span>
          <ScrapButton
            columnId={column.id}
            userId={profile?.id ?? null}
            initialScrapped={scrapped}
          />
        </div>
        <h1 className="mb-2 text-xl font-bold leading-snug text-white">
          {column.title}
        </h1>
        <div className="mb-4 text-xs text-[#5f6b82]">
          {authorNickname} · {dateLabel}
        </div>
        <SafeThumb
          src={column.cover_image_url}
          className="mb-4 w-full rounded-xl border border-[rgba(96,150,255,0.16)]"
        />
        <RichContent content={column.content} />

        <CommentsSection
          parentType="column"
          parentId={column.id}
          path={`/columns/${column.id}`}
          loggedIn={loggedIn}
          currentUserId={profile?.id ?? null}
          comments={columnComments}
        />
      </article>
      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
