"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { clientErrorMessage } from "@/lib/clientError";

/**
 * 사진을 여러 장(최대 max장) 올릴 수 있는 업로더예요. 업로드할 때마다
 * 새 URL을 배열 끝에 추가하는 방식이라, 같은 사진을 두 번 골라도
 * (매번 새 파일 경로로 저장되니까) 문제없이 중복으로 올라가요.
 * 폼 제출용으로 각 URL을 hidden input(name=fieldName)으로도 같이 그려줘요.
 */
export function MultiImageUploader({
  value,
  onChange,
  max = 5,
  folder = "columns",
  label = "사진 업로드",
  accept = "image/*",
  showCamera = false,
  fieldName = "screenshot_urls",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  folder?: string;
  label?: string;
  accept?: string;
  showCamera?: boolean;
  fieldName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, max - value.length);
  const full = remaining <= 0;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const url = await uploadMediaFile(file, folder);
        uploaded.push(url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(clientErrorMessage(err, "업로드 실패"));
    } finally {
      setBusy(false);
    }
  }

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    await handleFiles(e.target.files);
    e.target.value = "";
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((url, i) => (
        <input key={url + i} type="hidden" name={fieldName} value={url} />
      ))}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative h-16 w-16 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`사진 ${i + 1}`}
                className="h-16 w-16 rounded-lg border border-[rgba(96,150,255,0.25)] object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="사진 삭제"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#f87171] text-[10px] font-bold text-white shadow"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || full}
          className="shrink-0 rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-2 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
        >
          {busy ? "업로드 중..." : `📎 ${label}`}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
        />
        {showCamera && (
          <>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={busy || full}
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
        <span className="text-[11px] text-[#5f6b82]">
          {value.length}/{max}장
        </span>
      </div>
      {error && <span className="text-[11px] text-[#f87171]">{error}</span>}
    </div>
  );
}
