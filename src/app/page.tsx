import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";

export default async function Home() {
  const profile = await getCurrentProfile();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          임프로 트레이딩랩
        </h1>
        <p className="text-sm text-[#93a0b8] mb-10">
          실제 서비스로 만드는 중이에요 — 지금은 회원가입/로그인/관리자 VIP
          전환까지 작동해요.
        </p>

        {profile ? (
          <div className="flex flex-col gap-3">
            <p className="text-white">
              {profile.nickname}님, 환영해요
              {profile.is_vip ? " (VIP)" : ""}
            </p>
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-xl bg-gradient-to-r from-[#f6d888] to-[#e8b94b] py-3 font-bold text-[#241a04]"
              >
                관리자 페이지로
              </Link>
            )}
            <form action={logout}>
              <button className="w-full text-sm text-[#93a0b8] underline">
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f]"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-[rgba(96,150,255,0.3)] py-3 font-bold text-white"
            >
              회원가입
            </Link>
            <Link
              href="/admin/login"
              className="text-xs text-[#5f6b82] underline mt-4"
            >
              관리자 로그인
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
