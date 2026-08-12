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
  showBannerButton = false,
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  placeholder?: string;
  rows?: number;
  folder?: string;
  helpText?: string;
  /** 본문 중간에 "[[banner]]" 소통방 홍보 배너를 삽입하는 버튼을 보여줄지 */
  showBannerButton?: boolean;
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
    if (items.length > 0) {
      e.preventDefault();
      items.forEach((it) => {
        const file = it.getAsFile();
        if (file) void uploadAndInsert(file, pos);
      });
      return;
    }

    // 3) 이미지가 아니라 "파일 이름"만 텍스트로 복사된 경우 — 카카오톡 PC 등
    //    일부 프로그램은 이미지를 복사해도 브라우저에는 파일명 텍스트만
    //    전달돼요(원본 앱이 표준 클립보드 이미지 형식을 안 쓰는 경우). 이건
    //    저희 쪽에서 고칠 수 없는 그 프로그램의 제한이라, 대신 바로
    //    알려드리고 버튼으로 올리도록 안내해요.
    const text = dt.getData("text/plain")?.trim() ?? "";
    const looksLikeBareFilename =
      /^[\w.\-]+\.(png|jpe?g|gif|webp|avif|bmp|heic|heif|mp4|webm|mov|m4v)$/i.test(
        text
      );
    if (looksLikeBareFilename) {
      e.preventDefault();
      setError(
        `"${text}" — 이 이미지는 파일명만 복사돼서 인식할 수 없어요 (복사한 프로그램의 제한이에요). 아래 "갤러리에서 선택" 버튼으로 올려주세요.`
      );
    }
  }

  async function handleClipboardButton() {
    setError(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setError("이 브라우저는 클립보드 붙여넣기 버튼을 지원하지 않아요. Ctrl+V로 시도해주세요.");
        return;
      }
      const items = await navigator.clipboard.read();
      const pos = textareaRef.current?.selectionStart ?? value.length;
      let found = false;
      for (const item of items) {
        const imageType = item.types.find(
          (t) => t.startsWith("image/") || t.startsWith("video/")
        );
        if (!imageType) continue;
        found = true;
        const blob = await item.getType(imageType);
        const file = new File([blob], `clipboard.${imageType.split("/")[1] || "png"}`, {
          type: imageType,
        });
        await uploadAndInsert(file, pos);
      }
      if (!found) {
        setError(
          "클립보드에서 이미지를 찾을 수 없어요. 복사한 소스가 이미지 파일 자체가 아닐 수 있어요."
        );
      }
    } catch {
      setError(
        "클립보드 접근이 거부됐어요. 브라우저 권한을 허용하거나 갤러리에서 선택해주세요."
      );
    }
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

  function handleInsertBanner() {
    const pos = textareaRef.current?.selectionStart ?? value.length;
    onChange(insertAtPosition(value, pos, "[[banner]]"));
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
        <button
          type="button"
          onClick={handleClipboardButton}
          disabled={busy}
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
        >
          📋 클립보드 붙여넣기
        </button>
        {showBannerButton && (
          <button
            type="button"
            onClick={handleInsertBanner}
            disabled={busy}
            className="rounded-lg border border-[rgba(232,185,75,0.4)] px-3 py-1.5 text-xs font-semibold text-[#f6d888] disabled:opacity-60"
          >
            📢 소통방 배너 삽입
          </button>
        )}
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
        업로드되고 커서 위치에 들어가요. <code>#</code>/<code>##</code>로
        시작하는 줄은 제목, <code>&gt;</code>로 시작하는 줄은 인용구가 돼요.
        {showBannerButton &&
          " 커서를 원하는 위치에 두고 \"📢 소통방 배너 삽입\" 버튼을 누르면 그 자리에 홍보 배너가 들어가요."}
        {helpText ? ` ${helpText}` : ""}
      </p>
    </div>
  );
}
