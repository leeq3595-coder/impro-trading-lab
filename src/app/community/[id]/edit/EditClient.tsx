"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateCommunityPost } from "@/app/community/write/actions";
import { MediaUploader } from "@/components/MediaUploader";
import { ContentEditor } from "@/components/ContentEditor";

type PostToEdit = {
  id: string;
  post_type: "profit_proof" | "strategy_share";
  title: string | null;
  content: string | null;
  symbol: string | null;
  trade_count: number | null;
  seed_amount: number | null;
  profit_amount: number | null;
  screenshot_url: string | null;
};

export default function EditClient({ post }: { post: PostToEdit }) {
  const updateWithId = updateCommunityPost.bind(null, post.id);
  const [state, formAction, pending] = useActionState(updateWithId, undefined);
  const [screenshotUrl, setScreenshotUrl] = useState(post.screenshot_url ?? "");
  const [content, setContent] = useState(post.content ?? "");

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 pb-24">
      <div className="mx-auto max-w-md">
        <Link href={`/community/${post.id}`} className="text-sm text-[#93a0b8]">
          ← 취소
        </Link>
        <h1 className="mb-6 mt-2 text-2xl font-bold text-white">
          {post.post_type === "profit_proof" ? "🔥 수익인증 수정" : "📘 매매법공유 수정"}
        </h1>

        <form action={formAction} className="flex flex-col gap-3">
          {post.post_type === "profit_proof" ? (
            <>
              <input
                name="symbol"
                defaultValue={post.symbol ?? ""}
                placeholder="종목 (예: BTC/USDT)"
                required
                className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="seed_amount"
                  type="number"
                  defaultValue={post.seed_amount ?? ""}
                  placeholder="시드 금액 ($)"
                  required
                  className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <input
                  name="profit_amount"
                  type="number"
                  defaultValue={post.profit_amount ?? ""}
                  placeholder="수익 금액 ($)"
                  required
                  className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
              </div>
              <input
                name="trade_count"
                type="number"
                defaultValue={post.trade_count ?? ""}
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
              <textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="한줄 소감 (선택)"
                rows={3}
                className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
            </>
          ) : (
            <>
              <input
                name="title"
                defaultValue={post.title ?? ""}
                placeholder="제목"
                required
                className="rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <ContentEditor
                name="content"
                value={content}
                onChange={setContent}
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
            {pending ? "저장 중..." : "수정 저장"}
          </button>
        </form>
      </div>
    </main>
  );
}
