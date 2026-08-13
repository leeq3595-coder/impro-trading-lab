"use client";

import { useRef } from "react";

/**
 * 사진 업로드 버튼 없이 "굵게" 기능만 있는 가벼운 textarea예요.
 * (ContentEditor는 이미지 업로드 버튼이 여러 개라 짧은 텍스트 칸에 쓰면
 * 헷갈릴 수 있어서, 굵게만 필요한 곳엔 이걸 대신 써요)
 */
export function BoldTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleBold() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    const alreadyWrapped =
      selected.length > 0 && before.endsWith("**") && after.startsWith("**");

    let nextValue: string;
    let nextStart: number;
    let nextEnd: number;

    if (alreadyWrapped) {
      nextValue = before.slice(0, -2) + selected + after.slice(2);
      nextStart = start - 2;
      nextEnd = end - 2;
    } else if (selected.length > 0) {
      nextValue = `${before}**${selected}**${after}`;
      nextStart = start + 2;
      nextEnd = end + 2;
    } else {
      nextValue = `${before}****${after}`;
      nextStart = start + 2;
      nextEnd = start + 2;
    }

    onChange(nextValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      handleBold();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBold}
          title="선택한 글자를 굵게 (Ctrl/Cmd+B)"
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-bold text-[#93a0b8]"
        >
          B 굵게
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
      />
    </div>
  );
}
