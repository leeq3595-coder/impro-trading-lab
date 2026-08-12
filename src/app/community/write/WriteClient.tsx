"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createCommunityPost } from "./actions";
import { MediaUploader } from "@/components/MediaUploader";
import { ContentEditor } from "@/components/ContentEditor";

export default function WriteClient() {
  const [state, formAction, pending] = useActionState(
    createCommunityPost,
    undefined
  );
  const [postType, setPostType] = useState<"profit_proof" | "strategy_share">(
    "profit_proof"
  );
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [profitContent, setProfitContent] = useState("");
  const [strategyContent, setStrategyContent] = useState("");

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 pb-24">
      <div className="mx-auto max-w-md">
        <Link href="/community" className="text-sm text-[#93a0b8]">
          ← 커뮤니티
        </Link>
        <h1 className="mb-6 mt-2 text-2xl font-bold text-white">글쓰기</h1>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPostType("profit_proof")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
              postType === "profit_proof"
                ? "bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-[#04101f]"
                : "bg-[#0b1120] text-[#93a0b8]"
            }`}
          >
            🔥 수익인증
          </button>
          <button
            type="button"
            onClick={() => setPostType("strategy_share")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
              postType === "strategy_share"
                ? "bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-[#04101f]"
                : "bg-[#0b1120] text-[#93a0b8]"
            }`}
          >
            📘 매매법공유
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="post_type" value={postType} />

          {postType === "profit_proof" ? (
            <>
              <input
                name="symbol"
                placeholder="종목 (예: BTC/USDT)"
                required
                className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="seed_amount"
                  type="number"
                  placeholder="시드 금액 ($)"
                  required
                  className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <input
                  name="profit_amount"
                  type="number"
                  placeholder="수익 금액 ($)"
                  required
                  className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
              </div>
              <input
                name="trade_count"
                type="number"
                placeholder="매매 횟수 (선택)"
                className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <div className="flex flex-col gap-2">
                <input
                  name="screenshot_url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="인증 스크린샷 URL (선택)"
                  className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <MediaUploader
                  folder="community/screenshot"
                  label="스크린샷 업로드"
                  accept="image/*"
                  showCamera
                  onUploaded={(url) => setScreenshotUrl(url)}
                />
              </div>
              <ContentEditor
                name="content"
                value={profitContent}
                onChange={setProfitContent}
                placeholder="한줄 소감 (선택)"
                rows={3}
                folder="community/body"
              />
            </>
          ) : (
            <>
              <input
                name="title"
                placeholder="제목"
                required
                className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <ContentEditor
                name="content"
                value={strategyContent}
                onChange={setStrategyContent}
                placeholder="매매법 내용"
                rows={8}
                folder="community/body"
              />
            </>
          )}

          {state?.error && (
            <p className="text-sm text-[#f87171]">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 font-bold text-[#04101f] disabled:opacity-60"
          >
            {pending ? "등록 중..." : "등록하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
