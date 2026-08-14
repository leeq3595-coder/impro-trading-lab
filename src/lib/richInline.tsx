import type { ReactNode } from "react";

// 본문 안에서 "굵게"랑 "글씨 크기"를 표시하는 인라인 마크업을 다뤄요.
//
// 저장 형식(플레인 텍스트 안에 마커만 섞여있는 방식, 기존 **굵게** 방식과 동일한
// 접근이에요 — 그래서 예전에 저장된 글도 그대로 호환돼요):
//   굵게: **텍스트**
//   글씨 크기: [s]작게[/s]  [l]크게[/l]  [xl]아주크게[/xl]
// 두 개는 어느 순서로든 겹쳐 쓸 수 있어요 — **[xl]텍스트[/xl]** 든
// [xl]**텍스트**[/xl] 든 둘 다 "굵고 아주 크게"로 똑같이 렌더링돼요.
export type SizeKey = "s" | "l" | "xl";

export const SIZE_PX: Record<SizeKey, string> = {
  s: "12px",
  l: "19px",
  xl: "24px",
};

export const SIZE_LABEL: Record<SizeKey, string> = {
  s: "작게",
  l: "크게",
  xl: "아주크게",
};

type InlineNode =
  | { type: "text"; value: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "size"; key: SizeKey; children: InlineNode[] };

type Token =
  | { type: "text"; value: string }
  | { type: "bold_toggle" }
  | { type: "size_open"; key: SizeKey }
  | { type: "size_close"; key: SizeKey };

const TOKEN_RE = /(\*\*|\[s\]|\[\/s\]|\[l\]|\[\/l\]|\[xl\]|\[\/xl\])/g;

function tokenize(text: string): Token[] {
  const parts = text.split(TOKEN_RE);
  const tokens: Token[] = [];
  for (const part of parts) {
    if (part === "") continue;
    switch (part) {
      case "**":
        tokens.push({ type: "bold_toggle" });
        break;
      case "[s]":
        tokens.push({ type: "size_open", key: "s" });
        break;
      case "[/s]":
        tokens.push({ type: "size_close", key: "s" });
        break;
      case "[l]":
        tokens.push({ type: "size_open", key: "l" });
        break;
      case "[/l]":
        tokens.push({ type: "size_close", key: "l" });
        break;
      case "[xl]":
        tokens.push({ type: "size_open", key: "xl" });
        break;
      case "[/xl]":
        tokens.push({ type: "size_close", key: "xl" });
        break;
      default:
        tokens.push({ type: "text", value: part });
    }
  }
  return tokens;
}

type Frame =
  | { type: "root"; children: InlineNode[] }
  | { type: "bold"; children: InlineNode[] }
  | { type: "size"; key: SizeKey; children: InlineNode[] };

// 마커가 섞인 텍스트를 트리 구조로 파싱해요. **는 열림/닫힘 구분이 없는 토글이라
// "지금 열려있는 굵게가 있는지"로 열지 닫을지 판단하고, [l] 같은 크기 마커는
// 명시적으로 짝이 맞는 태그를 찾아서 닫아요. 짝이 안 맞는 마커(손으로 잘못
// 입력한 경우 등)는 그냥 텍스트로 남겨서 화면이 깨지지 않게 해요.
export function parseInlineTree(text: string): InlineNode[] {
  const tokens = tokenize(text);
  const stack: Frame[] = [{ type: "root", children: [] }];

  function closeFrame() {
    const frame = stack.pop();
    if (!frame || frame.type === "root") return;
    const node: InlineNode =
      frame.type === "bold"
        ? { type: "bold", children: frame.children }
        : { type: "size", key: frame.key, children: frame.children };
    stack[stack.length - 1].children.push(node);
  }

  for (const tok of tokens) {
    const top = stack[stack.length - 1];
    if (tok.type === "text") {
      top.children.push({ type: "text", value: tok.value });
      continue;
    }
    if (tok.type === "bold_toggle") {
      let boldIdx = -1;
      for (let i = stack.length - 1; i >= 1; i--) {
        if (stack[i].type === "bold") {
          boldIdx = i;
          break;
        }
      }
      if (boldIdx === -1) {
        stack.push({ type: "bold", children: [] });
      } else {
        while (stack.length - 1 >= boldIdx) closeFrame();
      }
      continue;
    }
    if (tok.type === "size_open") {
      stack.push({ type: "size", key: tok.key, children: [] });
      continue;
    }
    // size_close
    let idx = -1;
    for (let i = stack.length - 1; i >= 1; i--) {
      const frame = stack[i];
      if (frame.type === "size" && frame.key === tok.key) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      top.children.push({ type: "text", value: `[/${tok.key}]` });
    } else {
      while (stack.length - 1 >= idx) closeFrame();
    }
  }
  while (stack.length > 1) closeFrame();
  return stack[0].children;
}

function inlineTreeToReact(nodes: InlineNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (node.type === "text") return node.value;
    if (node.type === "bold") {
      return <strong key={key}>{inlineTreeToReact(node.children, key)}</strong>;
    }
    return (
      <span key={key} style={{ fontSize: SIZE_PX[node.key] }}>
        {inlineTreeToReact(node.children, key)}
      </span>
    );
  });
}

// "**굵게**"/"[l]크게[/l]" 마커가 섞인 텍스트를 실제 화면에 보여줄 React
// 엘리먼트로 바꿔요. (칼럼/글 상세 페이지 렌더링용)
export function renderRichInline(text: string, keyPrefix: string): ReactNode[] {
  return inlineTreeToReact(parseInlineTree(text), keyPrefix);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineTreeToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return escapeHtml(node.value).replace(/\n/g, "<br>");
      }
      if (node.type === "bold") {
        return `<b>${inlineTreeToHtml(node.children)}</b>`;
      }
      return `<span data-size="${node.key}" style="font-size:${SIZE_PX[node.key]}">${inlineTreeToHtml(
        node.children
      )}</span>`;
    })
    .join("");
}

// 저장된 텍스트(마커 포함)를 편집기(contentEditable)에 처음 채워 넣을 때 쓰는
// HTML로 바꿔요. 굵게/글씨크기가 편집 중에도 바로 눈에 보이게 하기 위함이에요.
export function textToEditorHtml(text: string): string {
  const html = inlineTreeToHtml(parseInlineTree(text));
  return html === "" ? "<br>" : html;
}
