import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoticeById } from "@/lib/publicData";
import { excerptFromContent, toAbsoluteUrl, SITE_URL } from "@/lib/ogText";
import { OgTags } from "@/components/OgTags";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { RichContent } from "@/components/RichContent";

export const revalidate = 0;

// 홈 화면 공지 배너를 누르면 들어오는 공지 상세 페이지예요.
export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [profile, notice] = await Promise.all([
    getCurrentProfile(),
    getNoticeById(id),
  ]);
  const loggedIn = !!profile;

  if (!notice) notFound();

  const ogTitle = `📢 ${notice.title} - 임프로트레이딩랩`;
  const ogDescription = excerptFromContent(notice.content);
  const ogImage = toAbsoluteUrl("/profile-logo.jpg");
  const ogUrl = `${SITE_URL}/notices/${id}`;
  const ogTags = (
    <OgTags
      title={ogTitle}
      description={ogDescription}
      image={ogImage}
      url={ogUrl}
    />
  );

  const dateLabel = new Date(notice.created_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".");

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      {ogTags}
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <Link href="/" className="text-sm text-[#93a0b8]">
          ← 홈
        </Link>
      </header>
      <article className="mx-auto max-w-md px-4 pb-6 pt-[68px]">
        <span className="mb-3 inline-block rounded-full bg-[rgba(232,185,75,0.18)] px-2.5 py-1 text-[11px] font-bold text-[#f6d888]">
          공지
        </span>
        <h1 className="mb-2 text-xl font-bold leading-snug text-white">
          {notice.title}
        </h1>
        <div className="mb-4 text-xs text-[#5f6b82]">{dateLabel}</div>
        <RichContent content={notice.content} autoLink />
      </article>
      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
