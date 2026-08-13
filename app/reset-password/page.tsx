"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "phone" | "code" | "newpw" | "done";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "reset_password" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "발송 실패");
      if (data.dev) setDevCode(data.devCode);
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "발송 실패");
    } finally {
      setBusy(false);
    }
  }

  function goToNewPw() {
    if (code.length < 6) return;
    setError(null);
    setStep("newpw");
  }

  async function submitNewPassword() {
    setError(null);
    if (pw1.length < 8) {
      setError("비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (pw1 !== pw2) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          purpose: "reset_password",
          newPassword: pw1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "변경 실패");
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">비밀번호 재설정</h1>
        <p className="text-sm text-[#93a0b8] mb-8">
          가입 시 인증한 휴대폰 번호로 본인 확인 후 새 비밀번호를 설정해요
        </p>

        {step === "phone" && (
          <div className="flex flex-col gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="가입한 휴대폰 번호 ('-' 없이)"
              className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
            />
            <button
              onClick={sendOtp}
              disabled={busy || phone.length < 10}
              className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
            >
              {busy ? "발송 중..." : "인증번호 받기"}
            </button>
          </div>
        )}

        {step === "code" && (
          <div className="flex flex-col gap-3">
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
              onClick={goToNewPw}
              disabled={code.length < 6}
              className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
            >
              다음
            </button>
          </div>
        )}

        {step === "newpw" && (
          <div className="flex flex-col gap-3">
            <input
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              type="password"
              placeholder="새 비밀번호 (8자 이상)"
              className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
            />
            <input
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              type="password"
              placeholder="새 비밀번호 확인"
              className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
            />
            <button
              onClick={submitNewPassword}
              disabled={busy || !pw1 || !pw2}
              className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
            >
              {busy ? "변경 중..." : "비밀번호 변경하기"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.08)] p-4 text-sm text-[#f3f5f9]">
              ✓ 비밀번호가 변경됐어요. 새 비밀번호로 로그인해주세요.
            </div>
            <Link
              href="/login"
              className="text-center rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f]"
            >
              로그인하러 가기
            </Link>
          </div>
        )}

        {error && <p className="text-sm text-[#f87171] mt-3">{error}</p>}

        {step !== "done" && (
          <p className="mt-6 text-sm text-[#93a0b8]">
            <Link href="/login" className="text-[#38bdf8] font-semibold">
              로그인으로 돌아가기
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
