"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthGate } from "./AuthGateProvider";

export type CommunityPostCard = {
  id: string;
  post_type: "profit_proof" | "strategy_share";
  authorNickname: string;
  content: string | null;
  screenshot_url: string | null;
  profit_rate: number | null;
  likes_count: number;
  comments_count: number;
  timeLabel: string;
};

// content 안에 이미지/동영상 파일 링크만 통째로 들어있는 경우, 목록 미리보기에는
// URL 텍스트를 그대로 보여주지 않고 감춰요 (본문 상세에서는 정상적으로 그림으로 보여요).
const MEDIA_LINE_RE =
  /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|mp4|webm|mov|m4v)(?:\?\S*)?$/i;

function previewText(content: string) {
  return content
    .split("\n")
    .filter((line) => !MEDIA_LINE_RE.test(line.trim()))
    .join(" ")
    .trim();
}

export function CommunityTabs({
  loggedIn,
  profitPosts,
  strategyPosts,
}: {
  loggedIn: boolean;
  profitPosts: CommunityPostCard[];
  strategyPosts: CommunityPostCard[] | null;
}) {
  const [tab, setTab] = useState<"profit" | "strategy">("profit");
  const { openGate } = useAuthGate();

  function handleStrategyTab() {
    if (!loggedIn) {
      openGate(
        "매매법공유는 회원만 볼 수 있어요. 간편가입하고 다른 회원들의 매매법을 확인해보세요."
      );
      return;
    }
    setTab("strategy");
  }

  const posts = tab === "profit" ? profitPosts : strategyPosts ?? [];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("profit")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
            tab === "profit"
              ? "bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-[#04101f]"
              : "bg-[#0b1120] text-[#93a0b8]"
          }`}
        >
          🔥 수익인증
        </button>
        <button
          onClick={handleStrategyTab}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
            tab === "strategy"
              ? "bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-[#04101f]"
              : "bg-[#0b1120] text-[#93a0b8]"
          }`}
        >
          📘 매매법공유{" "}
          {!loggedIn && <span className="ml-0.5 text-xs">🔒</span>}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[rgba(96,150,255,0.2)] bg-[#0b1120]/50 p-6 text-center text-xs text-[#5f6b82]">
            {tab === "profit"
              ? "아직 등록된 수익인증이 없어요"
              : "아직 등록된 매매법공유가 없어요"}
          </div>
        )}
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/community/${p.id}`}
            className="block rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4"
          >
            <span
              className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                p.post_type === "profit_proof"
                  ? "bg-[rgba(232,120,75,0.16)] text-[#f6a97e]"
                  : "bg-[rgba(96,150,255,0.16)] text-[#8fb3ff]"
              }`}
            >
              {p.post_type === "profit_proof" ? "🔥 수익인증" : "📘 매매법공유"}
            </span>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#243352]" />
              <span className="text-sm font-bold text-white">
                {p.authorNickname}
              </span>
              {p.profit_rate != null && (
                <span className="text-xs font-bold text-[#4ade80]">
                  +{p.profit_rate}%
                </span>
              )}
              <span className="ml-auto text-[11px] text-[#5f6b82]">
                {p.timeLabel}
              </span>
            </div>
            {p.screenshot_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.screenshot_url}
                alt=""
                loading="lazy"
                className="mb-2 h-40 w-full rounded-xl border border-[rgba(96,150,255,0.16)] object-cover"
              />
            )}
            {p.content && previewText(p.content) && (
              <p className="line-clamp-2 text-sm text-[#c9d3e6]">
                {previewText(p.content)}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-[#5f6b82]">
              <span>❤️ {p.likes_count}</span>
              <span>💬 {p.comments_count}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
