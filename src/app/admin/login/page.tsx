"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLogin, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm">
        <div className="inline-block mb-3 rounded-full border border-[rgba(232,185,75,0.45)] bg-[rgba(232,185,75,0.08)] px-3 py-1 text-xs font-bold text-[#f6d888]">
          ADMIN
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">관리자 로그인</h1>
        <p className="text-sm text-[#93a0b8] mb-8">
          임프로 트레이딩랩 관리자 전용 페이지예요
        </p>

        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="username"
            type="text"
            placeholder="관리자 아이디"
            required
            autoComplete="username"
            className="rounded-xl bg-[#101a30] border border-[rgba(232,185,75,0.25)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#e8b94b]"
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            required
            className="rounded-xl bg-[#101a30] border border-[rgba(232,185,75,0.25)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#e8b94b]"
          />
          {state?.error && (
            <p className="text-sm text-[#f87171]">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-gradient-to-r from-[#f6d888] to-[#e8b94b] py-3 font-bold text-[#241a04] disabled:opacity-60"
          >
            {pending ? "확인 중..." : "관리자 로그인"}
          </button>
        </form>
      </div>
    </main>
  );
}
