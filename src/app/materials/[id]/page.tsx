import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { getMaterialById } from "@/lib/publicData";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";
import { SafeThumb } from "@/components/SafeThumb";
import { MaterialDownloadButton } from "@/components/MaterialDownloadButton";

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

// 교재 게시글 상세 — 게시글 내용(썸네일/추가 이미지/설명)은 회원이면
// 누구나 그대로 보여주고, 실제 파일 다운로드만 VIP 확인을 해요 (다운로드
// 버튼은 항상 보이고, 눌렀을 때만 VIP 안내가 떠요 — MaterialDownloadButton
// 참고). 자료마다 따로 VIP 여부를 나누던 방식은 없앴어요 — 모든 자료의
// 다운로드가 VIP 전용이에요.
export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [profile, material] = await Promise.all([
    getCurrentProfile(),
    getMaterialById(id),
  ]);
  const loggedIn = !!profile;

  if (!material) notFound();

  // 자료실 목록과 마찬가지로, 비회원은 진입 즉시 가입유도 팝업만 보여줘요.
  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        <AutoGate message="자료실은 회원만 볼 수 있어요. 간편가입하고 무료 자료부터 확인해보세요." />
        <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
          <Link href="/materials" className="text-sm text-[#93a0b8]">
            ← 자료실
          </Link>
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

  const detailImages = material.detail_images ?? [];
  const userIsVip = !!profile?.is_vip;

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="fixed inset-x-0 top-0 z-40 [transform:translateZ(0)] border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <Link href="/materials" className="text-sm text-[#93a0b8]">
          ← 자료실
        </Link>
      </header>
      <article className="mx-auto max-w-md px-4 pb-6 pt-[68px]">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {material.is_pinned && (
            <span className="inline-block rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
              📌 고정
            </span>
          )}
          <span className="inline-block rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
            {material.category}
          </span>
        </div>

        <h1 className="mb-4 text-xl font-bold leading-snug text-white">
          {material.title}
        </h1>

        {material.thumbnail_url && (
          <SafeThumb
            src={material.thumbnail_url}
            className="mb-4 w-full rounded-xl border border-[rgba(96,150,255,0.16)]"
          />
        )}

        {material.description && (
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-[#e2e8f5]">
            {material.description}
          </p>
        )}

        {detailImages.length > 0 && (
          <div className="mb-6 flex flex-col gap-2">
            {detailImages.map((src, i) => (
              <SafeThumb
                key={src + i}
                src={src}
                alt={`자료 이미지 ${i + 1}`}
                className="w-full rounded-xl border border-[rgba(96,150,255,0.16)]"
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {material.file_url && (
            <MaterialDownloadButton
              url={material.file_url}
              filename={fileNameFromUrl(material.file_url, material.title)}
              userIsVip={userIsVip}
              className="w-full rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 text-center text-sm font-bold text-[#04101f] disabled:opacity-60"
            />
          )}
          {material.file_url && (
            <p className="text-center text-[11px] text-[#5f6b82]">
              📎 다운로드는 VIP 회원만 가능해요.
            </p>
          )}
          {material.video_url && (
            <a
              href={material.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[rgba(96,150,255,0.3)] py-3 text-center text-sm font-semibold text-[#93a0b8]"
            >
              ▶️ 영상 보기
            </a>
          )}
        </div>
      </article>
      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
