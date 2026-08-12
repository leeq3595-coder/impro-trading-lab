"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { clientErrorMessage } from "@/lib/clientError";

// 커서 위치에 텍스트를 끼워넣어요. (앞/뒤에 이미 줄바꿈이 있으면 중복으로 넣지 않아요)
function insertAtPosition(text: string, pos: number, insertText: string) {
  const safePos = Math.max(0, Math.min(pos, text.length));
  const before = text.slice(0, safePos);
  const after = text.slice(safePos);
  const needsLeadingBreak = before.length > 0 && !before.endsWith("\n");
  const lead = needsLeadingBreak ? "\n" : "";
  return `${before}${lead}${insertText}\n${after}`;
}

/**
 * 본문 에디터: 옛날 블로그처럼 갤러리에서 사진 선택 / 바로 촬영 / 붙여넣기(Ctrl+V) /
 * 드래그 앤 드롭으로 이미지·동영상을 올리면, 자동으로 Supabase Storage에 업로드되고
 * 커서 위치에 파일 링크가 삽입돼요. (RichContent가 그 줄을 자동으로 사진/영상으로 그려줘요)
 */
export function ContentEditor({
  value,
  onChange,
  name,
  placeholder,
  rows = 8,
  folder = "content",
  helpText,
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  placeholder?: string;
  rows?: number;
  folder?: string;
  helpText?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadAndInsert(file: File, posOverride?: number) {
    const pos =
      posOverride ?? textareaRef.current?.selectionStart ?? value.length;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadMediaFile(file, folder);
      onChange(insertAtPosition(value, pos, url));
    } catch (err) {
      setError(clientErrorMessage(err, "업로드 실패"));
    } finally {
      setBusy(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const dt = e.clipboardData;
    if (!dt) return;
    const pos = e.currentTarget.selectionStart;

    // 1) 파일 자체를 복사해서 붙여넣은 경우 (탐색기/파인더에서 파일 복사 등)
    const directFiles = Array.from(dt.files ?? []);
    if (directFiles.length > 0) {
      e.preventDefault();
      directFiles.forEach((f) => void uploadAndInsert(f, pos));
      return;
    }

    // 2) 클립보드에 이미지 데이터만 있는 경우 (스크린샷, "이미지 복사" 등)
    //    브라우저/OS에 따라 type이 비어있게 오는 경우도 있어서, kind가
    //    "file"이면 일단 붙잡아서 업로드를 시도해요 (텍스트로 새는 걸 방지).
    const items = Array.from(dt.items ?? []).filter(
      (it) => it.kind === "file"
    );
    if (items.length === 0) return; // 진짜 텍스트 붙여넣기는 그대로 통과
    e.preventDefault();
    items.forEach((it) => {
      const file = it.getAsFile();
      if (file) void uploadAndInsert(file, pos);
    });
  }

  function handleDrop(e: DragEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    e.preventDefault();
    const pos = e.currentTarget.selectionStart;
    files.forEach((f) => void uploadAndInsert(f, pos));
  }

  function handleDragOver(e: DragEvent<HTMLTextAreaElement>) {
    if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) {
      e.preventDefault();
    }
  }

  async function handlePickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadAndInsert(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
        >
          🖼️ 갤러리에서 선택
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
        >
          📸 바로 촬영
        </button>
        {busy && (
          <span className="text-[11px] text-[#8fb3ff]">업로드 중...</span>
        )}
      </div>
      {/* 갤러리 선택: 캡처 속성 없이 두면 모바일에서 사진/카메라/파일 중 고를 수 있어요 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handlePickFile}
        className="hidden"
      />
      {/* 바로 촬영: capture="environment"로 카메라 앱이 즉시 열려요 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePickFile}
        className="hidden"
      />
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        placeholder={placeholder}
        rows={rows}
        readOnly={busy}
        className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6] disabled:opacity-60"
      />
      {error && <p className="text-[11px] text-[#f87171]">{error}</p>}
      <p className="text-[11px] leading-relaxed text-[#5f6b82]">
        💡 사진/동영상은 버튼으로 올리거나, 복사한 이미지를 본문에{" "}
        <b>붙여넣기(Ctrl+V)</b>하거나 파일을 <b>끌어다 놓아도</b> 자동으로
        업로드되고 커서 위치에 들어가요.
        {helpText ? ` ${helpText}` : ""}
      </p>
    </div>
  );
}
