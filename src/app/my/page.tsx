import Link from "next/link";
import { requireMember } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";
import { BottomNav } from "@/components/BottomNav";

export const revalidate = 0;

export default async function MyPage() {
  const profile = await requireMember();

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[rgba(96,150,255,0.12)] bg-[#05070d] px-4 py-3">
        <h1 className="text-base font-bold text-white">마이페이지</h1>
      </header>

      <div className="mx-auto max-w-md px-4 pt-[64px]">
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#243352] text-xl">
            👤
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-bold text-white">
                {profile.nickname}
              </span>
              {profile.is_vip && (
                <span className="rounded-full bg-[rgba(232,185,75,0.18)] px-2 py-0.5 text-[10px] font-bold text-[#f6d888]">
                  VIP
                </span>
              )}
              {profile.role === "admin" && (
                <span className="rounded-full bg-[rgba(56,189,248,0.18)] px-2 py-0.5 text-[10px] font-bold text-[#38bdf8]">
                  ADMIN
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-xs text-[#93a0b8]">
              {profile.email}
            </div>
          </div>
        </div>

        {!profile.is_vip && (
          <div className="mb-6 rounded-2xl border border-[rgba(232,185,75,0.35)] bg-[rgba(232,185,75,0.06)] p-4">
            <div className="mb-1 text-sm font-bold text-white">
              아직 VIP 회원이 아니에요
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#93a0b8]">
              올림프트레이드 가입 후 관리자 확인이 완료되면 VIP 시그널·칼럼·자료실이
              자동으로 열려요.
            </p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4 text-center">
            <div className="text-[11px] text-[#5f6b82]">누적 포인트</div>
            <div className="mt-1 text-lg font-bold text-white">
              {profile.points_total.toLocaleString()}P
            </div>
          </div>
          <div className="rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4 text-center">
            <div className="text-[11px] text-[#5f6b82]">이번 달 포인트</div>
            <div className="mt-1 text-lg font-bold text-white">
              {profile.points_month.toLocaleString()}P
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col divide-y divide-[rgba(96,150,255,0.1)] overflow-hidden rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120]">
          <MenuRow label="내가 쓴 글" />
          <MenuRow label="스크랩" href="/my/scraps" />
          <MenuRow label="알림 설정" />
          <MenuRow label="고객센터" />
        </div>

        {profile.role === "admin" && (
          <Link
            href="/admin"
            className="mb-6 block rounded-xl border border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.06)] py-3 text-center text-sm font-bold text-[#38bdf8]"
          >
            관리자 페이지로 이동
          </Link>
        )}

        <form action={logout}>
          <button className="w-full rounded-xl border border-[rgba(96,150,255,0.18)] py-3 text-sm text-[#93a0b8]">
            로그아웃
          </button>
        </form>
      </div>

      <BottomNav loggedIn />
    </main>
  );
}

function MenuRow({ label, href }: { label: string; href?: string }) {
  const content = (
    <>
      {label}
      <span className="text-[#5f6b82]">›</span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center justify-between px-4 py-3.5 text-sm text-[#c9d3e6]"
      >
        {content}
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between px-4 py-3.5 text-sm text-[#c9d3e6] opacity-50">
      {content}
    </div>
  );
}
