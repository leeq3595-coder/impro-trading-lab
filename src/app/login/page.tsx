"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">임프로 트레이딩랩</h1>
        <p className="text-sm text-[#93a0b8] mb-8">로그인하고 계속하기</p>

        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="이메일"
            required
            className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            required
            className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
          />
          {state?.error && (
            <p className="text-sm text-[#f87171]">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#93a0b8]">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="text-[#38bdf8] font-semibold">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
