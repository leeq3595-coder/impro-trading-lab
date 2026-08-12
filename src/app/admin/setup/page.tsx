"use client";

import { useActionState } from "react";
import Link from "next/link";
import { bootstrapAdmin } from "./actions";

export default function AdminSetupPage() {
  const [state, formAction, pending] = useActionState(
    bootstrapAdmin,
    undefined
  );

  const done = state && "ok" in state;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-3 inline-block rounded-full border border-[rgba(232,185,75,0.45)] bg-[rgba(232,185,75,0.08)] px-3 py-1 text-xs font-bold text-[#f6d888]">
          ADMIN SETUP
        </div>
        <h1 className="mb-1 text-2xl font-bold text-white">
          최초 관리자 계정 만들기
        </h1>
        <p className="mb-8 text-sm text-[#93a0b8]">
          이 페이지는 관리자 계정이 하나도 없을 때 딱 한 번만 사용할 수 있어요.
          계정을 만들고 나면 자동으로 잠겨요.
        </p>

        {done ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.08)] p-4 text-sm text-[#f3f5f9]">
              ✓ 관리자 계정이 만들어졌어요. 이제 관리자 로그인 페이지에서
              방금 입력한 아이디/비밀번호로 로그인해보세요.
            </div>
            <Link
              href="/admin/login"
              className="rounded-xl bg-gradient-to-r from-[#f6d888] to-[#e8b94b] py-3 text-center font-bold text-[#241a04]"
            >
              관리자 로그인하러 가기
            </Link>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <input
              name="username"
              defaultValue="test"
              placeholder="관리자 아이디"
              required
              className="rounded-xl border border-[rgba(232,185,75,0.25)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#e8b94b]"
            />
            <input
              name="password"
              type="password"
              defaultValue="1111"
              placeholder="비밀번호"
              required
              className="rounded-xl border border-[rgba(232,185,75,0.25)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#e8b94b]"
            />
            {state && "error" in state && (
              <p className="text-sm text-[#f87171]">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-xl bg-gradient-to-r from-[#f6d888] to-[#e8b94b] py-3 font-bold text-[#241a04] disabled:opacity-60"
            >
              {pending ? "만드는 중..." : "관리자 계정 만들기"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
