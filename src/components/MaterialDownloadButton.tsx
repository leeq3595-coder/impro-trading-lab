"use client";

import { useState } from "react";
import Link from "next/link";
import { DownloadButton } from "@/components/DownloadButton";

// 자료실 다운로드 버튼이에요. 예전엔 자료마다 따로 "VIP 전용" 여부를
// 나눴는데, 이제는 자료별 구분 없이 "모든 자료의 다운로드는 VIP 회원만"
// 이에요 — 게시판/상세 페이지는 누구나(로그인한 회원이면) 그대로 다
// 보이고, 다운로드 버튼도 항상 보여주되 VIP가 아닌 회원이 누르면 "VIP
// 회원만 다운로드할 수 있어요" 안내 팝업만 뜨는 방식이에요.
export function MaterialDownloadButton({
  url,
  filename,
  userIsVip,
  className,
}: {
  url: string;
  filename?: string;
  userIsVip: boolean;
  className?: string;
}) {
  const [showVipGate, setShowVipGate] = useState(false);
  const locked = !userIsVip;

  if (!locked) {
    return (
      <DownloadButton url={url} filename={filename} className={className}>
        ⬇️ 다운로드
      </DownloadButton>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setShowVipGate(true)} className={className}>
        ⬇️ 다운로드
      </button>
      {showVipGate && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setShowVipGate(false)}
        >
          <div
            className="w-full rounded-t-3xl border border-[rgba(232,185,75,0.3)] bg-[#0b1324] p-6 pb-8 sm:max-w-sm sm:rounded-3xl sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[rgba(255,255,255,0.15)] sm:hidden" />
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6d888] to-[#e8b94b] text-2xl">
                🔒
              </div>
              <h2 className="mb-1 text-lg font-bold text-white">
                VIP 회원만 다운로드할 수 있어요
              </h2>
              <p className="mb-6 text-sm text-[#93a0b8]">
                올림프트레이드 가입 후 관리자 확인이 완료되면
                <br />
                VIP 자료를 다운로드할 수 있어요.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/my"
                onClick={() => setShowVipGate(false)}
                className="rounded-xl bg-gradient-to-r from-[#f6d888] to-[#e8b94b] py-3 text-center font-bold text-[#241a04]"
              >
                마이페이지에서 확인하기
              </Link>
              <button
                onClick={() => setShowVipGate(false)}
                className="mt-1 py-2 text-center text-xs text-[#5f6b82]"
              >
                나중에 할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
