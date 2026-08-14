import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { getColumnById, getAllLinkSettings } from "@/lib/publicData";
import { excerptFromContent, toAbsoluteUrl, SITE_URL } from "@/lib/ogText";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";
import { RichContent } from "@/components/RichContent";
import { ScrapButton } from "@/components/ScrapButton";
import { SafeThumb } from "@/components/SafeThumb";
import Link from "next/link";

export const revalidate = 0;

// ⭐ 카톡 미리보기용 태그를 generateMetadata 대신 페이지 컴포넌트 안에서
// 직접 <title>/<meta> 태그로 렌더링해요. (원인 불명으로 generateMetadata가
// 이 배포 환경에서 실행이 안 되는 문제가 있어서 — 오래 디버깅했지만 결국
// generateMetadata/미들웨어(proxy) 둘 다 프로덕션에서 실행 자체가 안 되는
// 걸 로그로 확인했어요.) React 19는 컴포넌트 트리 어디서든 <title>,
// <meta> 태그를 렌더링하면 자동으로 <head>로 옮겨줘요 — 이건 페이지
// 컴포넌트 자체(실제로 잘 실행되는 걸 확인한 코드)의 일부라서, 실행 안 되는
// generateMetadata/proxy에 기대는 것보다 훨씬 안전해요.
function OgTags({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image: string;
  url: string;
}) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="임프로 트레이딩랩" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}

// (예전엔 여기 generateMetadata가 있었는데, 이 배포 환경에서 실행 자체가
// 안 되는 게 확인돼서 제거했어요. 카톡 미리보기 태그는 이제 위 OgTags로
// 페이지 컴포넌트 안에서 직접 렌더링해요.)

export default async function ColumnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 로그인 확인이랑 칼럼 조회는 서로 관계없는 요청이라 동시에 보내요
  // (하나씩 순서대로 기다리면 왕복 시간이 그대로 더해져서 느려져요). 칼럼
  // 조회 자체는 캐시된 공개 데이터라 대부분 DB를 다시 안 맞고 바로 나가요.
  const [profile, column] = await Promise.all([
    getCurrentProfile(),
    getColumnById(id),
  ]);
  const loggedIn = !!profile;

  if (!column) notFound();

  const ogTitle = column.is_vip
    ? `🔒 [VIP] ${column.title} - 임프로트레이딩랩`
    : `${column.title} - 임프로트레이딩랩`;
  const ogDescription = excerptFromContent(column.content);
  const ogImage = toAbsoluteUrl(column.cover_image_url);
  const ogUrl = `${SITE_URL}/columns/${id}`;
  const ogTags = (
    <OgTags title={ogTitle} description={ogDescription} image={ogImage} url={ogUrl} />
  );

  const isLanding = column.is_hidden;

  // 비로그인 상태에서 VIP 칼럼 직접 접근 → 가입유도 팝업 + 잠금 화면
  if (column.is_vip && !loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        {ogTags}
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
        {ogTags}
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

  // 여기서부터는 서로 관계없는 요청 3개(작성자 닉네임 / 소통방 링크 / 스크랩
  // 여부)를 한꺼번에 보내요. 필요 없는 건(랜딩이 아니면 링크, 비로그인이거나
  // 랜딩이면 스크랩) 아예 요청 자체를 안 보내게 건너뛰어요. 링크는 캐시된
  // 공개 데이터라 대부분 DB를 다시 안 맞고 바로 나가요.
  const [authorResult, links, scrapResult] = await Promise.all([
    supabase
      .from("public_profiles")
      .select("nickname")
      .eq("id", column.author_id)
      .maybeSingle(),
    isLanding
      ? getAllLinkSettings()
      : Promise.resolve([] as { link_key: string; url: string }[]),
    profile && !isLanding
      ? supabase
          .from("scraps")
          .select("id")
          .eq("column_id", column.id)
          .eq("user_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null as { id: string } | null }),
  ]);

  let authorNickname = "임쁘로";
  if (authorResult.data) authorNickname = authorResult.data.nickname;

  const dateLabel = new Date(column.published_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".");

  let communityUrl = "/signup";
  if (isLanding) {
    const byKey = new Map(links.map((l) => [l.link_key, l.url]));
    communityUrl =
      byKey.get("community_chat") ||
      byKey.get("vip_signal_telegram") ||
      "/signup";
  }

  const scrapped = !!scrapResult.data;

  if (isLanding) {
    // 히든 랜딩페이지는 노션(Notion) 라이트 스타일 — 앱의 다른 페이지와 달리
    // 이 화면만 흰 배경 + 어두운 글씨로 가독성을 최대화해요.
    return (
      <main className="min-h-screen bg-white pb-28">
        {ogTags}
        <header className="flex items-center justify-center border-b border-[#eeeeec] bg-white px-4 py-3">
          <span className="text-sm font-bold text-[#111111]">
            임프로<span className="text-[#2f6feb]">트레이딩랩</span>
          </span>
        </header>
        <article className="mx-auto max-w-md px-5 py-7">
          <span className="mb-3 inline-block rounded-full bg-[#eef3fe] px-2.5 py-1 text-[11px] font-bold text-[#2f6feb]">
            {column.category}
          </span>
          <h1 className="mb-3 text-2xl font-bold leading-snug text-[#111111]">
            {column.title}
          </h1>
          <div className="mb-6 flex items-center gap-2 text-xs text-[#787774]">
            <span className="h-6 w-6 rounded-full bg-[#eeeeec]" />
            {authorNickname} · {dateLabel}
            <span className="ml-auto flex items-center gap-1 text-[#787774]">
              ❤️ {column.likes_count ?? 0}
            </span>
          </div>
          <SafeThumb
            src={column.cover_image_url}
            className="mb-6 w-full rounded-xl border border-[#e9e9e7]"
          />
          <RichContent
            content={column.content}
            theme="light"
            communityUrl={communityUrl}
          />
        </article>

        {/* 하단 고정 CTA 영역 — 흰 배경 위에서도 확실히 눈에 띄도록 계속 진한 톤 유지 */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#eeeeec] bg-[#070b16]/97 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
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
              👉노른자 소통방 입장하기🔥→
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      {ogTags}
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
        <div className="mb-4 flex items-center gap-2 text-xs text-[#5f6b82]">
          {authorNickname} · {dateLabel}
          <span className="ml-auto flex items-center gap-1 text-[#93a0b8]">
            ❤️ {column.likes_count ?? 0}
          </span>
        </div>
        <SafeThumb
          src={column.cover_image_url}
          className="mb-4 w-full rounded-xl border border-[rgba(96,150,255,0.16)]"
        />
        <RichContent content={column.content} />
      </article>
      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
