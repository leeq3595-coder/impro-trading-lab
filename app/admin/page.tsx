import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";

const MENU = [
  { href: "/admin/vip", label: "회원 VIP 업그레이드", ready: true, desc: "회원 검색, 올림프트레이드 UID 확인, VIP 전환" },
  { href: "/admin/columns", label: "칼럼 관리", ready: true, desc: "칼럼 작성 · 수정 · VIP 설정 · 공개/비공개" },
  { href: "/admin/landing", label: "🔗 히든 랜딩페이지 관리", ready: true, desc: "히든 페이지 작성 · 링크 복사 · 수정/삭제" },
  { href: "/admin/community", label: "커뮤니티 관리", ready: true, desc: "수익인증 · 매매법공유 등록/삭제" },
  { href: "/admin/materials", label: "자료실 관리", ready: true, desc: "문서 · 영상 링크 등록/수정/삭제" },
  { href: "/admin/notices", label: "공지사항 관리", ready: true, desc: "작성 · 상단고정 · 수정" },
  { href: "/admin/links", label: "바로가기 링크 관리", ready: true, desc: "홈 배너 등 외부 링크 설정" },
  { href: "/admin/rewards", label: "리워드 챌린지 관리", ready: false, desc: "1·2·3위 금액 설정 (준비중)" },
];

export default async function AdminDashboard() {
  const profile = await requireAdmin();

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-block mb-2 rounded-full border border-[rgba(232,185,75,0.45)] bg-[rgba(232,185,75,0.08)] px-3 py-1 text-xs font-bold text-[#f6d888]">
              ADMIN
            </div>
            <h1 className="text-2xl font-bold text-white">
              관리자 홈 — {profile.nickname}
            </h1>
          </div>
          <form action={logout}>
            <button className="text-sm text-[#93a0b8] underline">
              로그아웃
            </button>
          </form>
        </div>

        <div className="grid gap-3">
          {MENU.map((m) =>
            m.ready ? (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-2xl border border-[rgba(96,150,255,0.18)] bg-[#0b1120] px-5 py-4 hover:border-[#3b82f6] transition"
              >
                <div className="font-bold text-white">{m.label}</div>
                <div className="text-sm text-[#93a0b8] mt-1">{m.desc}</div>
              </Link>
            ) : (
              <div
                key={m.href}
                className="rounded-2xl border border-[rgba(96,150,255,0.1)] bg-[#0b1120] px-5 py-4 opacity-50"
              >
                <div className="font-bold text-white">{m.label}</div>
                <div className="text-sm text-[#93a0b8] mt-1">{m.desc}</div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
