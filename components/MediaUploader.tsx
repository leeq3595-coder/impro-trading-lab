"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { clientErrorMessage } from "@/lib/clientError";

export function MediaUploader({
  onUploaded,
  folder = "columns",
  label = "파일 업로드",
  accept = "image/*,video/*",
  showCamera = false,
}: {
  onUploaded: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
  /** 모바일에서 "바로 촬영" 버튼도 같이 보여줄지 (capture="environment") */
  showCamera?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadMediaFile(file, folder);
      onUploaded(url);
    } catch (err) {
      setError(clientErrorMessage(err, "업로드 실패"));
    } finally {
      setBusy(false);
    }
  }

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    await handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="shrink-0 rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-2 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
      >
        {busy ? "업로드 중..." : `📎 ${label}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {showCamera && (
        <>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={busy}
            className="shrink-0 rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-2 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
          >
            📸 바로 촬영
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
            className="hidden"
          />
        </>
      )}
      {error && <span className="text-[11px] text-[#f87171]">{error}</span>}
    </div>
  );
}
