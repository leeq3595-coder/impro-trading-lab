"use client";

import { useActionState } from "react";
import { useState } from "react";
import Link from "next/link";
import { createAdminAccount } from "./actions";

export default function AdminSetupPage() {
  const [state, formAction, pending] = useActionState(
    createAdminAccount,
    undefined
  );
  const [nickname, setNickname] = useState("");

  const done = state && "ok" in state;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-3 inline-block rounded-full border border-[rgba(232,185,75,0.45)] bg-[rgba(232,185,75,0.08)] px-3 py-1 text-xs font-bold text-[#f6d888]">
          ADMIN SETUP
        </div>
        <h1 className="mb-1 text-2xl font-bold text-white">
          관리자 계정 만들기
        </h1>
        <p className="mb-8 text-sm text-[#93a0b8]">
          관리자 생성 비밀번호를 아는 사람만 이 화면에서 관리자 계정을 만들
          수 있어요. 몇 번이든 다시 와서 새 관리자를 추가할 수 있어요.
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
              placeholder="관리자 아이디"
              autoComplete="off"
              required
              className="rounded-xl border border-[rgba(232,185,75,0.25)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#e8b94b]"
            />
            <input
              name="password"
              type="password"
              placeholder="관리자 비밀번호"
              autoComplete="new-password"
              required
              className="rounded-xl border border-[rgba(232,185,75,0.25)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#e8b94b]"
            />
            <input
              name="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="관리자 닉네임 (예: 임쁘로)"
              required
              className="rounded-xl border border-[rgba(232,185,75,0.25)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#e8b94b]"
            />
            {nickname.trim() && (
              <p className="-mt-1 px-1 text-[11px] text-[#5f6b82]">
                회원 페이지 등에는 &quot;{nickname.trim()}(관리자)&quot;로
                표시돼요.
              </p>
            )}
            <input
              name="setup_secret"
              type="password"
              placeholder="관리자 생성 비밀번호"
              autoComplete="off"
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
