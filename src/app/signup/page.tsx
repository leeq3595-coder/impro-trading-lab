"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createAccount } from "./actions";

type Step = 1 | 2 | 3;

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [userId, setUserId] = useState<string | null>(null);

  const [accountState, accountAction, accountPending] = useActionState(
    createAccount,
    undefined
  );

  // step1 성공 시 다음 단계로
  if (accountState && "ok" in accountState && step === 1) {
    setUserId(accountState.userId);
    setStep(2);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05070d] px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">회원가입</h1>
        <p className="text-sm text-[#93a0b8] mb-8">STEP {step} / 3</p>

        {step === 1 && (
          <form action={accountAction} className="flex flex-col gap-3">
            <input
              name="nickname"
              placeholder="닉네임"
              required
              className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
            />
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
              placeholder="비밀번호 (8자 이상)"
              required
              className="rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
            />
            <label className="flex items-center gap-2 text-sm text-[#93a0b8] mt-1">
              <input type="checkbox" name="agreed" />
              이용약관 및 개인정보처리방침에 동의해요
            </label>
            {accountState && "error" in accountState && (
              <p className="text-sm text-[#f87171]">{accountState.error}</p>
            )}
            <button
              type="submit"
              disabled={accountPending}
              className="mt-2 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
            >
              {accountPending ? "처리 중..." : "다음"}
            </button>
          </form>
        )}

        {step === 2 && userId && (
          <PhoneStep userId={userId} onDone={() => setStep(3)} />
        )}

        {step === 3 && <DoneStep />}

        {step === 1 && (
          <p className="mt-6 text-sm text-[#93a0b8]">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-[#38bdf8] font-semibold">
              로그인
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

function PhoneStep({
  userId,
  onDone,
}: {
  userId: string;
  onDone: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
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
        body: JSON.stringify({ phone, userId, purpose: "signup" }),
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
        body: JSON.stringify({ phone, code, userId, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "인증 실패");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#93a0b8]">
        이 번호가 아이디 찾기/비밀번호 재설정에 쓰이니 정확히 입력해주세요.
      </p>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="휴대폰 번호 ('-' 없이)"
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
            {busy ? "확인 중..." : "인증 확인"}
          </button>
        </>
      )}
      {error && <p className="text-sm text-[#f87171]">{error}</p>}
    </div>
  );
}

function DoneStep() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[rgba(232,185,75,0.45)] bg-[rgba(232,185,75,0.06)] p-4 text-sm text-[#f3f5f9] leading-relaxed">
        가입이 완료됐어요! 임쁘로 추천코드로 올림프트레이드에 가입하시면,
        관리자 확인 후 계정이 자동으로 VIP로 전환돼요. VIP 시그널, 커뮤니티,
        VIP 교재, VIP 칼럼까지 모두 제공됩니다.
      </div>
      <Link
        href="/login"
        className="text-center rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f]"
      >
        로그인하러 가기
      </Link>
    </div>
  );
}
