"use client";

import { useState } from "react";

// 파일 링크를 그냥 새 탭으로 열면(특히 PDF/이미지) 브라우저가 "보기"로만
// 열고 진짜 "다운로드"는 안 해주는 경우가 많아서, 파일을 직접 받아와서
// 저장 창을 띄우는 방식으로 만들었어요. 실패하면(네트워크 문제 등) 그냥
// 새 탭으로 열어서라도 받을 수 있게 해줘요.
export function DownloadButton({
  url,
  filename,
  className,
  children,
}: {
  url: string;
  filename?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("다운로드 실패");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || url.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={className}>
      {busy ? "다운로드 중..." : children}
    </button>
  );
}
