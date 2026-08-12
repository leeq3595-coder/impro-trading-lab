"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { clientErrorMessage } from "@/lib/clientError";

export function MediaUploader({
  onUploaded,
  folder = "columns",
  label = "파일 업로드",
  accept = "image/*,video/*",
}: {
  onUploaded: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
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
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
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
      {error && <span className="text-[11px] text-[#f87171]">{error}</span>}
    </div>
  );
}
