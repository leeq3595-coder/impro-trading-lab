import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import {
  getPublishedColumns,
  getAllCommunityPosts,
  getMaterialsList,
  getAllLinkSettings,
  getPinnedNotice,
  type PublicCommunityPost,
} from "@/lib/publicData";
import { SITE_URL, toAbsoluteUrl } from "@/lib/ogText";
import { OgTags } from "@/components/OgTags";
import { BottomNav } from "@/components/BottomNav";
import { GatedLink } from "@/components/GatedLink";
import { HomeBannerCarousel } from "@/components/HomeBannerCarousel";
import { SafeThumb } from "@/components/SafeThumb";

export const revalidate = 0;

// 홈은 레이아웃(layout.tsx)에 더 이상 openGraph/twitter 기본값이 없어서,
// 홈 전용 카톡 미리보기 태그를 여기서 직접 렌더링해요. (자세한 이유는
// layout.tsx 주석 참고)
const homeOgTags = (
  <OgTags
    title="임프로 트레이딩랩"
    description="임프로 트레이딩랩 — 크립토·트레이딩 교육 및 커뮤니티"
    image={toAbsoluteUrl("/profile-logo.jpg")}
    url={SITE_URL}
    type="website"
  />
);

type PostRow = PublicCommunityPost;

// content 안에 이미지/동영상 파일 링크만 통째로 들어있는 경우, 목록 미리보기에는
// URL 텍스트를 그대로 보여주지 않고 감춰요 (본문 상세에서는 정상적으로 그림으로 보여요).
const MEDIA_LINE_RE =
  /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|mp4|webm|mov|m4v)(?:\?\S*)?$/i;

function previewText(content: string) {
  return content
    .split("\n")
    .filter((line) => !MEDIA_LINE_RE.test(line.trim()))
    .join(" ")
    .trim();
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

export default async function Home() {
  const supabase = await createClient();

  // 로그인 확인이랑 홈 화면에 필요한 공개 데이터(공지/칼럼/커뮤니티/자료/링크)는
  // 서로 관계없는 요청이라 동시에 보내요. 공개 데이터는 전부 캐시된 걸
  // 재사용해요 — 칼럼/자료실/커뮤니티 목록 페이지랑도 캐시를 같이 써요.
  const [profile, notice, allColumns, allPosts, allMaterials, links] =
    await Promise.all([
      getCurrentProfile(),
      getPinnedNotice(),
      getPublishedColumns(),
      getAllCommunityPosts(),
      getMaterialsList(),
      getAllLinkSettings(),
    ]);
  const loggedIn = !!profile;

  const columns = allColumns.slice(0, 2);

  // 홈 화면 미리보기는 "전체보기"(수익인증+매매법공유 통합)와 동일한
  // 최신순 피드예요. 상단고정은 홈에는 반영하지 않고 진짜 최신글만 보여줘요.
  // 비로그인이면 매매법공유는 원래 못 보니 수익인증만 나가요.
  const posts: PostRow[] = allPosts
    .filter((p) => !p.is_pinned)
    .filter((p) => loggedIn || p.post_type === "profit_proof")
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 2);

  const materials = allMaterials.slice(0, 2);

  const authorIds = Array.from(
    new Set([
      ...(columns ?? []).map((c) => c.author_id),
      ...(posts ?? []).map((p) => p.author_id),
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

  const linkByKey = new Map(links.map((l) => [l.link_key, l.url]));
  const bannerUrls = {
    banner1_signup: linkByKey.get("banner1_signup") || "/signup",
    banner2_prop: linkByKey.get("banner2_prop") || "/signup",
    banner3_youtube: linkByKey.get("banner3_youtube") || "/",
  };
  const vipSignalUrl = linkByKey.get("vip_signal_telegram") || "/signup";
  const olympeFundedUrl = linkByKey.get("olympe_funded_detail") || "/signup";

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      {homeOgTags}
      {/* 헤더 — 모바일 사파리에서 sticky가 배너 위로 겹쳐 보이는 문제가 있어서
          fixed로 바꾸고, 아래 콘텐츠 영역에 그만큼 여백(pt)을 줬어요. */}
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] flex items-center justify-between border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#38bdf8] to-[#3b82f6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile-logo.jpg"
              alt="임프로트레이딩랩 로고"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-base font-bold text-white">
            임프로<span className="text-[#38bdf8]">트레이딩랩</span>
          </span>
        </div>
        <GatedLink
          href="/my"
          loggedIn={loggedIn}
          message="마이페이지는 로그인 후 이용할 수 있어요."
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101a30] text-[#93a0b8]"
        >
          👤
        </GatedLink>
      </header>

      <div className="mx-auto max-w-md px-4 pt-[76px]">
        {/* 배너 캐러셀 */}
        <HomeBannerCarousel urls={bannerUrls} />

        {/* 공지 */}
        {notice && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[rgba(232,185,75,0.3)] bg-[rgba(232,185,75,0.06)] px-3 py-2.5 text-xs text-[#f3f5f9]">
            <span className="rounded-full bg-[rgba(232,185,75,0.2)] px-2 py-0.5 font-bold text-[#f6d888]">
              공지
            </span>
            <span className="truncate">{notice.title}</span>
          </div>
        )}

        {/* 퀵메뉴 */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Link
            href="/columns"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] py-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.15)] text-lg">
              📈
            </span>
            <span className="text-xs font-semibold text-[#e2e8f5]">칼럼</span>
          </Link>
          <Link
            href="/community"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] py-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.15)] text-lg">
              💬
            </span>
            <span className="text-xs font-semibold text-[#e2e8f5]">
              커뮤니티
            </span>
          </Link>
          <GatedLink
            href="/materials"
            loggedIn={loggedIn}
            message="자료실은 회원만 볼 수 있어요. 간편가입하고 무료 자료부터 확인해보세요."
            className="flex flex-col items-center gap-2 rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] py-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.15)] text-lg">
              📁
            </span>
            <span className="text-xs font-semibold text-[#e2e8f5]">
              자료실
            </span>
          </GatedLink>
        </div>

        {/* 01 오늘의 칼럼 */}
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              <span className="text-[#38bdf8]">01</span> 오늘의 칼럼
            </h2>
            <Link href="/columns" className="text-xs text-[#5f6b82]">
              전체보기 ›
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {(columns ?? []).length === 0 && (
              <EmptyCard text="아직 등록된 칼럼이 없어요" />
            )}
            {(columns ?? []).map((c) =>
              c.is_vip ? (
                <GatedLink
                  key={c.id}
                  href={`/columns/${c.id}`}
                  loggedIn={loggedIn}
                  message="VIP 칼럼은 회원만 볼 수 있어요. 간편가입하고 바로 확인해보세요."
                  className="flex items-start gap-3 rounded-2xl border border-[rgba(232,185,75,0.35)] bg-[rgba(232,185,75,0.05)] p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(232,185,75,0.15)] text-base">
                    🔒
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      {c.is_pinned && (
                        <span className="rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
                          📌 고정
                        </span>
                      )}
                      <span className="inline-block rounded-full bg-[rgba(232,185,75,0.18)] px-2 py-0.5 text-[10px] font-bold text-[#f6d888]">
                        VIP 전용
                      </span>
                    </div>
                    <div className="truncate text-sm font-bold text-white">
                      {c.title}
                    </div>
                    <div className="mt-1 text-[11px] text-[#5f6b82]">
                      임쁘로 · {timeAgo(c.published_at)}
                    </div>
                  </div>
                </GatedLink>
              ) : (
                <Link
                  key={c.id}
                  href={`/columns/${c.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4"
                >
                  <SafeThumb
                    src={c.cover_image_url}
                    className="h-9 w-9 shrink-0 rounded-xl object-cover"
                    fallbackClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.15)] text-base"
                    fallbackEmoji="📊"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      {c.is_pinned && (
                        <span className="rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
                          📌 고정
                        </span>
                      )}
                      <span className="inline-block rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
                        {c.category}
                      </span>
                    </div>
                    <div className="truncate text-sm font-bold text-white">
                      {c.title}
                    </div>
                    <div className="mt-1 text-[11px] text-[#5f6b82]">
                      {nicknameById.get(c.author_id) ?? "임쁘로"} ·{" "}
                      {timeAgo(c.published_at)}
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </section>

        {/* 올림프 펀디드 배너 — 칼럼과 커뮤니티 섹션 사이 고정 프로모션 카드.
            "자세히 보기" 링크는 관리자 > 바로가기 링크 관리에서
            olympe_funded_detail 키로 바꿀 수 있어요. */}
        <a
          href={olympeFundedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-7 block rounded-2xl border border-[rgba(74,222,128,0.3)] bg-gradient-to-br from-[#0e2318] to-[#123420] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(74,222,128,0.15)] px-2.5 py-1 text-xs font-bold text-[#4ade80]">
              💰 올림프 펀디드
            </span>
            <span className="text-xs text-[#93a0b8]">자세히 보기 ›</span>
          </div>
          <div className="mb-2 text-base font-bold leading-snug text-white">
            내 돈 없이 최대 $15,000 시드 받고
            <br />
            수익의 80%는 내 몫으로
          </div>
          <p className="mb-4 text-xs leading-relaxed text-[#93a0b8]">
            🔥트레이딩판의 새로운 대세 - 프랍 트레이딩(Prop Trading)
            <br />
            계좌 수익 2배 달성 시 자금 즉시지원
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatMini value="$15,000" label="최대 지원금" />
            <StatMini value="80%" label="수익 배분" />
            <StatMini value="6~9" label="잔여 계좌" />
          </div>
        </a>

        {/* 02 수익인증 & 매매법공유 */}
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              <span className="text-[#38bdf8]">02</span> 수익인증 &amp;
              매매법공유
            </h2>
            <Link href="/community" className="text-xs text-[#5f6b82]">
              전체보기 ›
            </Link>
          </div>

          <a
            href={vipSignalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-3 rounded-2xl border border-[rgba(96,150,255,0.25)] bg-[rgba(59,130,246,0.08)] p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.18)] text-base">
              📡
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">
                VIP 시그널 참여하기
              </div>
              <div className="text-[11px] text-[#93a0b8]">
                텔레그램에서 실시간 매매 시그널 받기
              </div>
            </div>
            <span className="text-[#5f6b82]">→</span>
          </a>

          <div className="flex flex-col gap-3">
            {(posts ?? []).length === 0 && (
              <EmptyCard text="아직 등록된 글이 없어요" />
            )}
            {(posts ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/community/${p.id}`}
                className="block rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4"
              >
                <span
                  className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    p.post_type === "profit_proof"
                      ? "bg-[rgba(232,120,75,0.16)] text-[#f6a97e]"
                      : "bg-[rgba(96,150,255,0.16)] text-[#8fb3ff]"
                  }`}
                >
                  {p.post_type === "profit_proof" ? "🔥 수익인증" : "📘 매매법공유"}
                </span>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#243352]" />
                  <span className="text-sm font-bold text-white">
                    {nicknameById.get(p.author_id) ?? "회원"}
                  </span>
                  <span className="ml-auto text-[11px] text-[#5f6b82]">
                    {timeAgo(p.created_at)}
                  </span>
                </div>
                <SafeThumb
                  src={p.screenshot_urls?.[0] ?? p.screenshot_url}
                  className="mb-2 h-40 w-full rounded-xl border border-[rgba(96,150,255,0.16)] object-cover"
                />
                {p.content && previewText(p.content) && (
                  <p className="line-clamp-2 text-sm text-[#c9d3e6]">
                    {previewText(p.content)}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-[#5f6b82]">
                  <span>❤️ {p.likes_count + (p.likes_boost ?? 0)}</span>
                  <span>💬 {p.comments_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 03 교재 자료실 */}
        <section className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              <span className="text-[#38bdf8]">03</span> 교재 자료실
            </h2>
            <GatedLink
              href="/materials"
              loggedIn={loggedIn}
              message="자료실은 회원만 볼 수 있어요."
              className="text-xs text-[#5f6b82]"
            >
              전체보기 ›
            </GatedLink>
          </div>
          <div className="flex flex-col gap-3">
            {(materials ?? []).length === 0 && (
              <EmptyCard text="아직 등록된 자료가 없어요" />
            )}
            {(materials ?? []).map((m) => (
              <GatedLink
                key={m.id}
                href="/materials"
                loggedIn={loggedIn}
                message="자료실은 회원만 볼 수 있어요. 간편가입하고 무료 자료부터 확인해보세요."
                className="flex items-center gap-3 rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.15)] text-base">
                  {m.is_vip ? "🔒" : "📄"}
                </span>
                <div className="min-w-0 flex-1">
                  {m.is_pinned && (
                    <span className="mb-0.5 mr-1 inline-block rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
                      📌 고정
                    </span>
                  )}
                  <div className="truncate text-sm font-bold text-white">
                    {m.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#5f6b82]">
                    {m.is_vip ? "VIP 전용" : "무료"} · {m.category}
                  </div>
                </div>
              </GatedLink>
            ))}
          </div>
        </section>
      </div>

      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgba(96,150,255,0.2)] bg-[#0b1120]/50 p-6 text-center text-xs text-[#5f6b82]">
      {text}
    </div>
  );
}

function StatMini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.05)] p-2.5 text-center">
      <div className="text-sm font-bold text-[#4ade80]">{value}</div>
      <div className="mt-0.5 text-[10px] text-[#93a0b8]">{label}</div>
    </div>
  );
}
