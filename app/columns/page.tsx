import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { getPublishedColumns } from "@/lib/publicData";
import { BottomNav } from "@/components/BottomNav";
import { GatedLink } from "@/components/GatedLink";
import { SafeThumb } from "@/components/SafeThumb";

export const revalidate = 0;

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

export default async function ColumnsPage() {
  const supabase = await createClient();

  // 로그인 확인이랑 칼럼 목록 조회는 서로 관계없는 요청이라 동시에 보내요
  // (하나씩 순서대로 기다리면 왕복 시간이 그대로 더해져요). 칼럼 목록
  // 자체는 캐시된 공개 데이터라 대부분 DB를 다시 안 맞고 바로 나가요.
  const [profile, columns] = await Promise.all([
    getCurrentProfile(),
    getPublishedColumns(),
  ]);
  const loggedIn = !!profile;

  const authorIds = Array.from(new Set((columns ?? []).map((c) => c.author_id)));
  let nicknameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("public_profiles")
      .select("id,nickname")
      .in("id", authorIds);
    nicknameById = new Map((authors ?? []).map((a) => [a.id, a.nickname]));
  }

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <h1 className="text-base font-bold text-white">칼럼</h1>
      </header>

      <div className="mx-auto max-w-md px-4 pt-[64px]">
        <div className="flex flex-col gap-3">
          {(columns ?? []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-[rgba(96,150,255,0.2)] bg-[#0b1120]/50 p-6 text-center text-xs text-[#5f6b82]">
              아직 등록된 칼럼이 없어요
            </div>
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
      </div>

      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
