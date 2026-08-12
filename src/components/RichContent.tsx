// 칼럼 본문 텍스트를 줄 단위로 훑어서, "이미지 URL만 있는 줄"이나
// "유튜브 링크만 있는 줄"을 만나면 자동으로 이미지/영상으로 렌더링해요.
// 파일 업로드 서버가 없어도 본문 중간에 사진/영상을 넣을 수 있게 하는 간단한 방법이에요.
const IMAGE_RE = /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif)(?:\?\S*)?$/i;
const YOUTUBE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i;
// "!! " 로 시작하는 줄(연속되면 하나로 묶임)은 노션 콜아웃처럼 강조 박스로 렌더링돼요.
const CALLOUT_PREFIX = /^!!\s?/;

type Block =
  | { type: "text"; text: string }
  | { type: "image"; url: string }
  | { type: "youtube"; id: string }
  | { type: "callout"; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let calloutBuffer: string[] = [];

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

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (CALLOUT_PREFIX.test(line)) {
      flushText();
      calloutBuffer.push(line.replace(CALLOUT_PREFIX, ""));
      continue;
    }
    flushCallout();

    const ytMatch = line.match(YOUTUBE_RE);
    if (line && IMAGE_RE.test(line)) {
      flushText();
      blocks.push({ type: "image", url: line });
    } else if (line && ytMatch) {
      flushText();
      blocks.push({ type: "youtube", id: ytMatch[1] });
    } else {
      buffer.push(rawLine);
    }
  }
  flushCallout();
  flushText();
  return blocks;
}

export function RichContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);
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
              className="w-full rounded-xl border border-[rgba(96,150,255,0.16)]"
            />
          );
        }
        if (b.type === "youtube") {
          return (
            <div
              key={i}
              className="aspect-video w-full overflow-hidden rounded-xl border border-[rgba(96,150,255,0.16)]"
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
        if (b.type === "callout") {
          return (
            <div
              key={i}
              className="rounded-xl border border-[rgba(232,185,75,0.35)] bg-[rgba(232,185,75,0.07)] px-4 py-3.5"
            >
              <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[#f6d888]">
                {b.text}
              </p>
            </div>
          );
        }
        return (
          <p
            key={i}
            className="whitespace-pre-wrap text-sm leading-relaxed text-[#e2e8f5]"
          >
            {b.text}
          </p>
        );
      })}
    </div>
  );
}
