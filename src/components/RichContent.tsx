import type { ReactNode } from "react";

// 칼럼 본문 텍스트를 줄 단위로 훑어서, "이미지 URL만 있는 줄"이나
// "유튜브 링크만 있는 줄"을 만나면 자동으로 이미지/영상으로 렌더링해요.
// 파일 업로드 서버가 없어도 본문 중간에 사진/영상을 넣을 수 있게 하는 간단한 방법이에요.
const IMAGE_RE = /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif)(?:\?\S*)?$/i;
const VIDEO_RE = /^https?:\/\/\S+\.(?:mp4|webm|mov|m4v)(?:\?\S*)?$/i;
const YOUTUBE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i;
// "!! " 로 시작하는 줄(연속되면 하나로 묶임)은 노션 콜아웃처럼 강조 박스로 렌더링돼요.
const CALLOUT_PREFIX = /^!!\s?/;
// "> " 로 시작하는 줄(연속되면 하나로 묶임)은 인용구 박스로 렌더링돼요.
const QUOTE_PREFIX = /^>\s?/;
// "# / ## / ###" 로 시작하는 줄은 제목(H1/H2/H3)으로 렌더링돼요.
const HEADING_RE = /^(#{1,3})\s+(.+)$/;
// "[[banner]]" 한 줄만 있으면 소통방 홍보 배너로 바뀌어요.
const MIDBANNER_TOKEN = "[[banner]]";

type Block =
  | { type: "text"; text: string }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "blockquote"; text: string }
  | { type: "image"; url: string }
  | { type: "video"; url: string }
  | { type: "youtube"; id: string }
  | { type: "callout"; text: string }
  | { type: "midbanner" };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let calloutBuffer: string[] = [];
  let quoteBuffer: string[] = [];

  function flushText() {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ type: "text", text });
    buffer = [];
  }

  function flushCallout() {
    const text = calloutBuffer.join("\n").trim();
    if (text) blocks.push({ type: "callout", text });
    calloutBuffer = [];
  }

  function flushQuote() {
    const text = quoteBuffer.join("\n").trim();
    if (text) blocks.push({ type: "blockquote", text });
    quoteBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (CALLOUT_PREFIX.test(line)) {
      flushText();
      flushQuote();
      calloutBuffer.push(line.replace(CALLOUT_PREFIX, ""));
      continue;
    }
    flushCallout();

    if (QUOTE_PREFIX.test(line)) {
      flushText();
      quoteBuffer.push(line.replace(QUOTE_PREFIX, ""));
      continue;
    }
    flushQuote();

    if (line === MIDBANNER_TOKEN) {
      flushText();
      blocks.push({ type: "midbanner" });
      continue;
    }

    const headingMatch = line.match(HEADING_RE);
    const ytMatch = line.match(YOUTUBE_RE);
    if (headingMatch) {
      flushText();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
    } else if (line && IMAGE_RE.test(line)) {
      flushText();
      blocks.push({ type: "image", url: line });
    } else if (line && VIDEO_RE.test(line)) {
      flushText();
      blocks.push({ type: "video", url: line });
    } else if (line && ytMatch) {
      flushText();
      blocks.push({ type: "youtube", id: ytMatch[1] });
    } else {
      buffer.push(rawLine);
    }
  }
  flushCallout();
  flushQuote();
  flushText();
  return blocks;
}

// "**굵게**" 표시를 <strong>으로 바꿔줘요.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

type Theme = "dark" | "light";

const THEME_CLASSES: Record<
  Theme,
  {
    text: string;
    heading: string;
    muted: string;
    imageBorder: string;
    quoteBorder: string;
    quoteBg: string;
    quoteText: string;
    calloutBorder: string;
    calloutBg: string;
    calloutText: string;
  }
> = {
  dark: {
    text: "text-[#e2e8f5]",
    heading: "text-white",
    muted: "text-[#93a0b8]",
    imageBorder: "border-[rgba(96,150,255,0.16)]",
    quoteBorder: "border-[rgba(96,150,255,0.4)]",
    quoteBg: "bg-[rgba(96,150,255,0.05)]",
    quoteText: "text-[#c9d3e6]",
    calloutBorder: "border-[rgba(232,185,75,0.35)]",
    calloutBg: "bg-[rgba(232,185,75,0.07)]",
    calloutText: "text-[#f6d888]",
  },
  light: {
    text: "text-[#33332e]",
    heading: "text-[#111111]",
    muted: "text-[#787774]",
    imageBorder: "border-[#e9e9e7]",
    quoteBorder: "border-[#d8d6cf]",
    quoteBg: "bg-[#f7f6f3]",
    quoteText: "text-[#4a4944]",
    calloutBorder: "border-[#f1e2b6]",
    calloutBg: "bg-[#fbf3db]",
    calloutText: "text-[#8a6d1f]",
  },
};

export function RichContent({
  content,
  theme = "dark",
  communityUrl,
}: {
  content: string;
  theme?: Theme;
  communityUrl?: string;
}) {
  const blocks = parseBlocks(content);
  const c = THEME_CLASSES[theme];

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => {
        if (b.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={b.url}
              alt=""
              loading="lazy"
              className={`w-full rounded-xl border ${c.imageBorder}`}
            />
          );
        }
        if (b.type === "video") {
          return (
            <video
              key={i}
              src={b.url}
              controls
              playsInline
              className={`w-full rounded-xl border ${c.imageBorder}`}
            />
          );
        }
        if (b.type === "youtube") {
          return (
            <div
              key={i}
              className={`aspect-video w-full overflow-hidden rounded-xl border ${c.imageBorder}`}
            >
              <iframe
                src={`https://www.youtube.com/embed/${b.id}`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          );
        }
        if (b.type === "midbanner") {
          return <MidBanner key={i} communityUrl={communityUrl} />;
        }
        if (b.type === "heading") {
          const HeadingTag = (
            b.level === 1 ? "h2" : b.level === 2 ? "h3" : "h4"
          ) as "h2" | "h3" | "h4";
          const sizeClass =
            b.level === 1
              ? "text-xl mt-2"
              : b.level === 2
                ? "text-lg mt-1"
                : "text-base";
          return (
            <HeadingTag
              key={i}
              className={`${sizeClass} font-bold leading-snug ${c.heading}`}
            >
              {renderInline(b.text, `h${i}`)}
            </HeadingTag>
          );
        }
        if (b.type === "blockquote") {
          return (
            <blockquote
              key={i}
              className={`rounded-r-lg border-l-4 ${c.quoteBorder} ${c.quoteBg} py-2.5 pl-4 pr-3`}
            >
              <p
                className={`whitespace-pre-wrap text-sm italic leading-relaxed ${c.quoteText}`}
              >
                {renderInline(b.text, `q${i}`)}
              </p>
            </blockquote>
          );
        }
        if (b.type === "callout") {
          return (
            <div
              key={i}
              className={`rounded-xl border ${c.calloutBorder} ${c.calloutBg} px-4 py-3.5`}
            >
              <p
                className={`whitespace-pre-wrap text-sm font-semibold leading-relaxed ${c.calloutText}`}
              >
                {renderInline(b.text, `c${i}`)}
              </p>
            </div>
          );
        }
        return (
          <p
            key={i}
            className={`whitespace-pre-wrap text-sm leading-relaxed ${c.text}`}
          >
            {renderInline(b.text, `t${i}`)}
          </p>
        );
      })}
    </div>
  );
}

// 본문 중간에 넣는 소통방 홍보 배너 — 페이지 테마(라이트/다크)와 상관없이
// 눈에 띄도록 항상 골드 그라데이션 카드로 렌더링돼요. 카드 전체가 링크예요.
function MidBanner({ communityUrl }: { communityUrl?: string }) {
  const href = communityUrl || "/signup";
  const avatars = ["/chat-proof-1.png", "/chat-proof-2.png", "/chat-proof-3.png"];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-2xl border border-[rgba(232,185,75,0.4)] bg-gradient-to-br from-[#1c1508] to-[#2a1e08] p-5 no-underline shadow-lg shadow-black/10"
    >
      <div className="mb-3 flex -space-x-3">
        {avatars.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className="h-11 w-11 rounded-full border-2 border-[#241a04] object-cover"
            style={{ zIndex: avatars.length - i }}
          />
        ))}
      </div>
      <div className="mb-1 text-base font-bold text-white">
        노른자 트레이딩 소통방 open!
      </div>
      <p className="mb-3 text-sm leading-relaxed text-[#f3e6c5]">
        남들은 모르는 차트 맥점과 대응 전략, 소통방에서 실시간으로
        확인하세요.
      </p>
      <span className="inline-block rounded-xl bg-gradient-to-r from-[#f6d888] to-[#e8b94b] px-4 py-2 text-sm font-bold text-[#241a04]">
        🔥 지금 입장하기 →
      </span>
    </a>
  );
}
