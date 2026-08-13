import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { getMaterialsList } from "@/lib/publicData";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";
import { SafeThumb } from "@/components/SafeThumb";
import { DownloadButton } from "@/components/DownloadButton";

function fileNameFromUrl(url: string, fallback: string) {
  try {
    const last = url.split("/").pop() || "";
    const ext = last.includes(".") ? last.split(".").pop() : "";
    return ext ? `${fallback}.${ext}` : fallback;
  } catch {
    return fallback;
  }
}

export const revalidate = 0;

export default async function MaterialsPage() {
  // 로그인 확인이랑 자료 목록 조회는 서로 관계없는 요청이라 동시에 보내요.
  // 자료 목록 자체는 캐시된 공개 데이터라 대부분 DB를 다시 안 맞고 바로
  // 나가요 (비회원이면 어차피 아래에서 목록을 안 쓰고 잠금 화면만 보여줘요).
  const [profile, materials] = await Promise.all([
    getCurrentProfile(),
    getMaterialsList(),
  ]);
  const loggedIn = !!profile;

  // 자료실은 비회원에게 목록조차 보여주지 않고 진입 즉시 가입유도 팝업을 띄워요.
  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        <AutoGate message="자료실은 회원만 볼 수 있어요. 간편가입하고 무료 자료부터 확인해보세요." />
        <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
          <h1 className="text-base font-bold text-white">자료실</h1>
        </header>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#3b82f6] text-2xl">
            🔒
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            자료실은 회원 전용이에요
          </h1>
          <p className="mb-6 text-sm text-[#93a0b8]">
            간편가입하고 차트 이론, 매매전략 자료를 확인해보세요.
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

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <h1 className="text-base font-bold text-white">자료실</h1>
      </header>

      <div className="mx-auto max-w-md px-4 pt-[64px]">
        <div className="flex flex-col gap-3">
          {(materials ?? []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-[rgba(96,150,255,0.2)] bg-[#0b1120]/50 p-6 text-center text-xs text-[#5f6b82]">
              아직 등록된 자료가 없어요
            </div>
          )}
          {(materials ?? []).map((m) => {
            const canAccess = !m.is_vip || profile?.is_vip;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  canAccess
                    ? "border-[rgba(96,150,255,0.16)] bg-[#0b1120]"
                    : "border-[rgba(232,185,75,0.3)] bg-[rgba(232,185,75,0.05)]"
                }`}
              >
                {m.thumbnail_url ? (
                  <SafeThumb
                    src={m.thumbnail_url}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.15)] text-base">
                    {m.is_vip ? "🔒" : "📄"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {m.is_pinned && (
                    <span className="mb-0.5 mr-1 inline-block rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
                      📌 고정
                    </span>
                  )}
                  <div className="truncate text-sm font-bold text-white">
                    {m.title}
                  </div>
                  {m.description && (
                    <div className="mt-0.5 truncate text-[11px] text-[#93a0b8]">
                      {m.description}
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-[#5f6b82]">
                    {m.is_vip ? "VIP 전용" : "무료"} · {m.category}
                  </div>
                </div>
                {!canAccess ? (
                  <span className="shrink-0 text-[10px] font-bold text-[#f6d888]">
                    VIP전환필요
                  </span>
                ) : (
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {m.file_url && (
                      <DownloadButton
                        url={m.file_url}
                        filename={fileNameFromUrl(m.file_url, m.title)}
                        className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-3 py-1.5 text-xs font-bold text-[#04101f] disabled:opacity-60"
                      >
                        ⬇️ 다운로드
                      </DownloadButton>
                    )}
                    {m.video_url && (
                      <a
                        href={m.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8]"
                      >
                        ▶️ 영상 보기
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
