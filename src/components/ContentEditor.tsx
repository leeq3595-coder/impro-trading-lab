"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { clientErrorMessage } from "@/lib/clientError";
import { textToEditorHtml, SIZE_LABEL, type SizeKey } from "@/lib/richInline";

/**
 * 본문 에디터: 옛날 블로그처럼 갤러리에서 사진 선택 / 바로 촬영 / 붙여넣기(Ctrl+V) /
 * 드래그 앤 드롭으로 이미지·동영상을 올리면, 자동으로 Supabase Storage에 업로드되고
 * 커서 위치에 파일 링크가 삽입돼요. (RichContent가 그 줄을 자동으로 사진/영상으로 그려줘요)
 *
 * "굵게"/"글씨 크기"는 저장은 예전이랑 똑같이 **텍스트**, [l]텍스트[/l] 같은
 * 마커가 섞인 일반 텍스트로 하되(그래서 예전 글도 100% 호환돼요), 편집 화면
 * 자체는 실제로 굵고 크게 "보이게" contentEditable로 렌더링해요 — 그래서
 * **처럼 마커 기호가 그대로 보이지 않고, 선택해서 버튼 누르면 바로 반영돼요.
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
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  // 우리가 직접 onChange로 흘려보낸 마지막 값을 기억해뒀다가, 그거랑 다른
  // value가 들어오면(=글 전환 등 "바깥"에서 바뀐 경우) 그때만 화면을
  // 다시 그려요. 매 타이핑마다 다시 그리면 커서 위치가 튀어버려요.
  const lastEmittedRef = useRef<string>(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value !== lastEmittedRef.current && editorRef.current) {
      editorRef.current.innerHTML = textToEditorHtml(value);
      lastEmittedRef.current = value;
    }
  }, [value]);

  function syncFromDom() {
    const editor = editorRef.current;
    if (!editor) return;
    const text = serializeDomToText(editor);
    lastEmittedRef.current = text;
    onChange(text);
  }

  // 버튼 클릭처럼 에디터 바깥을 눌러도(포커스가 잠깐 벗어나도) 마지막
  // 커서 위치를 기억해뒀다가 그 자리에 그대로 삽입/서식 적용할 수 있게 해요.
  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else if (sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function insertTextAtCursor(text: string) {
    restoreSelection();
    document.execCommand("insertText", false, text);
    syncFromDom();
  }

  async function uploadAndInsert(file: File) {
    setBusy(true);
    setError(null);
    try {
      const url = await uploadMediaFile(file, folder);
      const editor = editorRef.current;
      const needsLeadingBreak =
        !!editor && editor.textContent && editor.textContent.length > 0;
      insertTextAtCursor(`${needsLeadingBreak ? "\n" : ""}${url}\n`);
    } catch (err) {
      setError(clientErrorMessage(err, "업로드 실패"));
    } finally {
      setBusy(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const dt = e.clipboardData;
    if (!dt) return;

    // 1) 파일 자체를 복사해서 붙여넣은 경우 (탐색기/파인더에서 파일 복사 등)
    const directFiles = Array.from(dt.files ?? []);
    if (directFiles.length > 0) {
      e.preventDefault();
      directFiles.forEach((f) => void uploadAndInsert(f));
      return;
    }

    // 2) 클립보드에 이미지 데이터만 있는 경우 (스크린샷, "이미지 복사" 등)
    const items = Array.from(dt.items ?? []).filter((it) => it.kind === "file");
    if (items.length > 0) {
      e.preventDefault();
      items.forEach((it) => {
        const file = it.getAsFile();
        if (file) void uploadAndInsert(file);
      });
      return;
    }

    // 3) 이미지가 아니라 "파일 이름"만 텍스트로 복사된 경우
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
      return;
    }

    // 4) 그 외 일반 텍스트 붙여넣기 — 워드/다른 웹페이지 등에서 복사한
    //    서식(색깔, 폰트 등)이 같이 딸려오면 저장 형식이 깨질 수 있어서,
    //    항상 순수 텍스트로만 붙여넣어요.
    e.preventDefault();
    document.execCommand("insertText", false, text);
    syncFromDom();
  }

  async function handleClipboardButton() {
    setError(null);
    saveSelection();
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setError("이 브라우저는 클립보드 붙여넣기 버튼을 지원하지 않아요. Ctrl+V로 시도해주세요.");
        return;
      }
      const items = await navigator.clipboard.read();
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
        await uploadAndInsert(file);
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

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    e.preventDefault();
    files.forEach((f) => void uploadAndInsert(f));
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
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
    const editor = editorRef.current;
    const needsLeadingBreak =
      !!editor && editor.textContent && editor.textContent.length > 0;
    insertTextAtCursor(`${needsLeadingBreak ? "\n" : ""}[[banner]]\n`);
  }

  // 선택한 글자를 굵게(토글) — 브라우저 자체 굵게 기능을 그대로 써서
  // 선택 없이 눌러도(커서만 있어도) 그다음 타이핑부터 굵게 입력돼요.
  function handleBold() {
    restoreSelection();
    document.execCommand("bold");
    syncFromDom();
  }

  // 선택한 글자의 크기를 바꿔요. "보통"을 누르면 크기 지정을 다시 없애요.
  // (커서만 있고 아무것도 선택 안 했으면 아무 일도 안 일어나요 — 먼저
  // 글자를 드래그해서 선택해야 해요)
  function handleSize(key: SizeKey | "n") {
    restoreSelection();
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !editor) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    if (key === "n") {
      const spans = editor.querySelectorAll("span[data-size]");
      spans.forEach((span) => {
        if (!range.intersectsNode(span)) return;
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
      });
    } else {
      const frag = range.extractContents();
      const span = document.createElement("span");
      span.setAttribute("data-size", key);
      span.appendChild(frag);
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    syncFromDom();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      handleBold();
    }
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
        {busy && <span className="text-[11px] text-[#8fb3ff]">업로드 중...</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[rgba(96,150,255,0.12)] pt-1.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBold}
          title="선택한 글자를 굵게 (Ctrl/Cmd+B)"
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-bold text-[#93a0b8]"
        >
          B 굵게
        </button>
        <span className="text-[11px] text-[#5f6b82]">글씨크기:</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSize("s")}
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1 text-[11px] text-[#93a0b8]"
        >
          {SIZE_LABEL.s}
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSize("n")}
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs text-[#93a0b8]"
        >
          보통
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSize("l")}
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-2 text-sm text-[#93a0b8]"
        >
          {SIZE_LABEL.l}
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSize("xl")}
          className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-2.5 text-base font-semibold text-[#93a0b8]"
        >
          {SIZE_LABEL.xl}
        </button>
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
      {/* 폼 제출(action)에서 name으로 값을 읽는 곳이 있어서, 실제 값은 이
          숨겨진 input에 동기화해둬요 (contentEditable div는 자체적으로 폼
          값을 안 실어요). */}
      {name && <input ref={hiddenInputRef} type="hidden" name={name} value={value} readOnly />}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncFromDom}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={handleKeyDown}
        onBlur={saveSelection}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.6}em` }}
        className="empty:before:content-[attr(data-placeholder)] empty:before:text-[#5f6b82] rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm leading-relaxed text-white outline-none focus:border-[#3b82f6] whitespace-pre-wrap break-words"
      />
      {error && <p className="text-[11px] text-[#f87171]">{error}</p>}
      <p className="text-[11px] leading-relaxed text-[#5f6b82]">
        💡 사진/동영상은 버튼으로 올리거나, 복사한 이미지를 본문에{" "}
        <b>붙여넣기(Ctrl+V)</b>하거나 파일을 <b>끌어다 놓아도</b> 자동으로
        업로드되고 커서 위치에 들어가요. <code>#</code>/<code>##</code>로
        시작하는 줄은 제목, <code>&gt;</code>로 시작하는 줄은 인용구가 돼요.
        굵게/글씨크기는 원하는 부분을 드래그해서 선택한 다음 위 버튼을
        누르면 바로 반영돼요.
        {showBannerButton &&
          " 커서를 원하는 위치에 두고 \"📢 소통방 배너 삽입\" 버튼을 누르면 그 자리에 홍보 배너가 들어가요."}
        {helpText ? ` ${helpText}` : ""}
      </p>
    </div>
  );
}

// contentEditable 안의 실제 DOM을 저장용 텍스트(마커 포함)로 다시 바꿔요.
// (textToEditorHtml의 반대 방향 — 이 둘이 항상 서로 왕복이 맞아야 편집
// 화면이랑 저장되는 내용이 어긋나지 않아요)
function serializeDomToText(root: Node): string {
  let result = "";
  root.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent ?? "";
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") {
      result += "\n";
    } else if (tag === "div" || tag === "p") {
      const needsLeadingBreak = result.length > 0 && !result.endsWith("\n");
      result += (needsLeadingBreak ? "\n" : "") + serializeDomToText(el) + "\n";
    } else if (tag === "b" || tag === "strong") {
      result += `**${serializeDomToText(el)}**`;
    } else if (tag === "span" && el.hasAttribute("data-size")) {
      const key = el.getAttribute("data-size");
      result += `[${key}]${serializeDomToText(el)}[/${key}]`;
    } else {
      // 인식 못 하는 태그(붙여넣기로 딸려온 서식 등)는 태그만 걷어내고
      // 안의 텍스트만 살려요.
      result += serializeDomToText(el);
    }
  });
  return result;
}
