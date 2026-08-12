import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { BottomNav } from "@/components/BottomNav";
import { GatedLink } from "@/components/GatedLink";
import { HomeBannerCarousel } from "@/components/HomeBannerCarousel";
import { SafeThumb } from "@/components/SafeThumb";

export const revalidate = 0;

type ColumnRow = {
  id: string;
  title: string;
  category: string;
  is_vip: boolean;
  author_id: string;
  cover_image_url: string | null;
  published_at: string;
};

type PostRow = {
  id: string;
  post_type: "profit_proof" | "strategy_share";
  author_id: string;
  content: string | null;
  screenshot_url: string | null;
  profit_rate: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

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

type MaterialRow = {
  id: string;
  title: string;
  category: string;
  is_vip: boolean;
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

export default async function Home() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const loggedIn = !!profile;

  const [
    { data: notice },
    { data: columns },
    { data: posts },
    { data: materials },
    { data: links },
  ] = await Promise.all([
    supabase
      .from("notices")
      .select("id,title")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("columns")
      .select("id,title,category,is_vip,author_id,cover_image_url,published_at")
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("published_at", { ascending: false })
      .limit(2)
      .returns<ColumnRow[]>(),
    supabase
      .from("community_posts")
      .select(
        "id,post_type,author_id,content,screenshot_url,profit_rate,likes_count,comments_count,created_at"
      )
      .eq("post_type", "profit_proof")
      .order("created_at", { ascending: false })
      .limit(2)
      .returns<PostRow[]>(),
    supabase
      .from("materials")
      .select("id,title,category,is_vip,created_at")
      .order("created_at", { ascending: false })
      .limit(2)
      .returns<MaterialRow[]>(),
    supabase
      .from("link_settings")
      .select("link_key,url")
      .in("link_key", [
        "banner1_signup",
        "banner2_prop",
        "banner3_youtube",
        "vip_signal_telegram",
      ]),
  ]);

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

  const linkByKey = new Map((links ?? []).map((l) => [l.link_key, l.url]));
  const bannerUrls = {
    banner1_signup: linkByKey.get("banner1_signup") || "/signup",
    banner2_prop: linkByKey.get("banner2_prop") || "/signup",
    banner3_youtube: linkByKey.get("banner3_youtube") || "/",
  };
  const vipSignalUrl = linkByKey.get("vip_signal_telegram") || "/signup";

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      {/* 헤더 — 모바일 사파리에서 sticky가 배너 위로 겹쳐 보이는 문제가 있어서
          fixed로 바꾸고, 아래 콘텐츠 영역에 그만큼 여백(pt)을 줬어요. */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#3b82f6] text-sm font-bold text-[#04101f]">
            임
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
                    <span className="mb-1 inline-block rounded-full bg-[rgba(232,185,75,0.18)] px-2 py-0.5 text-[10px] font-bold text-[#f6d888]">
                      VIP 전용
                    </span>
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
                    <span className="mb-1 inline-block rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
                      {c.category}
                    </span>
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
              <EmptyCard text="아직 등록된 수익인증이 없어요" />
            )}
            {(posts ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/community/${p.id}`}
                className="block rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4"
              >
                <span className="mb-2 inline-block rounded-full bg-[rgba(232,120,75,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f6a97e]">
                  🔥 수익인증
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
                  src={p.screenshot_url}
                  className="mb-2 h-40 w-full rounded-xl border border-[rgba(96,150,255,0.16)] object-cover"
                />
                {p.content && previewText(p.content) && (
                  <p className="line-clamp-2 text-sm text-[#c9d3e6]">
                    {previewText(p.content)}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-[#5f6b82]">
                  <span>❤️ {p.likes_count}</span>
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
