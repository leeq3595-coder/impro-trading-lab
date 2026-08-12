"use client";

import { useState } from "react";
import Link from "next/link";

export default function FindEmailPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "find_email" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "발송 실패");
      setSent(true);
      if (data.dev) setDevCode(data.devCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "발송 실패");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, purpose: "find_email" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "인증 실패");
      setFoundEmail(data.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">아이디 찾기</h1>
        <p className="text-sm text-[#93a0b8] mb-8">
          가입 시 인증한 휴대폰 번호로 확인해요
        </p>

        {foundEmail ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[rgba(96,150,255,0.3)] bg-[rgba(59,130,246,0.08)] p-4 text-center">
              <div className="text-xs text-[#93a0b8] mb-1">가입하신 이메일이에요</div>
              <div className="text-lg font-bold text-white">{foundEmail}</div>
            </div>
            <Link
              href="/login"
              className="text-center rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f]"
            >
              로그인하러 가기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="가입한 휴대폰 번호 ('-' 없이)"
              disabled={sent}
              className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6] disabled:opacity-60"
            />
            {!sent ? (
              <button
                onClick={sendOtp}
                disabled={busy || phone.length < 10}
                className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
              >
                {busy ? "발송 중..." : "인증번호 받기"}
              </button>
            ) : (
              <>
                {devCode && (
                  <p className="text-xs text-[#93a0b8]">
                    (개발 모드 — SMS 키 미설정: 인증번호 {devCode})
                  </p>
                )}
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="인증번호 6자리"
                  className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={verifyOtp}
                  disabled={busy || code.length < 6}
                  className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
                >
                  {busy ? "확인 중..." : "확인"}
                </button>
              </>
            )}
            {error && <p className="text-sm text-[#f87171]">{error}</p>}
          </div>
        )}

        <p className="mt-6 text-sm text-[#93a0b8]">
          <Link href="/login" className="text-[#38bdf8] font-semibold">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}
