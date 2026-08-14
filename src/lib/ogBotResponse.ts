import { excerptFromContent } from "@/lib/ogText";

// 카카오톡/페이스북/트위터 등 "링크 미리보기 봇"들의 User-Agent 패턴이에요.
// (Next.js가 자체적으로 갖고 있는 기본 봇 목록 + 카카오톡을 추가한 거예요)
export const OG_BOT_UA_RE =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|kakaotalk-scrap|kakaostory|daumoa/i;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = "https://improtradinglab.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toAbsoluteImage(url: string | null | undefined): string {
  if (!url) return `${SITE_URL}/profile-logo.jpg`;
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url}`;
}

function ogHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  const { title, description, image, url } = opts;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="임프로 트레이딩랩" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>${escapeHtml(title)}</body>
</html>`;
}

// generateMetadata가 이 프로젝트의 배포 환경에서 원인 불명으로 실행되지
// 않는 문제가 있어서(오래 디버깅했지만 원인을 못 찾았어요), 미들웨어에서
// 봇 요청만 직접 가로채 Supabase REST API로 데이터를 가져와 og 태그가 다
// 채워진 완성된 HTML을 즉시 만들어 돌려줘요.
export async function buildColumnOgResponse(id: string): Promise<Response | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/columns?id=eq.${id}&select=title,content,cover_image_url,is_vip`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const column = rows?.[0];
    if (!column) return null;

    const title = column.is_vip
      ? `🔒 [VIP] ${column.title} - 임프로트레이딩랩`
      : `${column.title} - 임프로트레이딩랩`;
    const description = excerptFromContent(column.content || "");
    const image = toAbsoluteImage(column.cover_image_url);

    return new Response(
      ogHtml({ title, description, image, url: `${SITE_URL}/columns/${id}` }),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    console.error("[og-bot] column fetch failed:", e);
    return null;
  }
}

export async function buildCommunityOgResponse(
  id: string
): Promise<Response | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/community_posts?id=eq.${id}&select=post_type,title,content,symbol,profit_rate,screenshot_url,screenshot_urls`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const post = rows?.[0];
    if (!post) return null;

    const isProfitProof = post.post_type === "profit_proof";
    let title: string;
    if (isProfitProof) {
      const rate = post.profit_rate != null ? `+${post.profit_rate}%` : "수익";
      const symbol = post.symbol ? `[${post.symbol}] ` : "";
      title = `🔥 ${symbol}${rate} 수익인증 - 임프로트레이딩랩`;
    } else {
      title = post.title
        ? `📘 ${post.title} - 임프로트레이딩랩`
        : "📘 매매법공유 - 임프로트레이딩랩";
    }
    const description = post.content
      ? excerptFromContent(post.content)
      : "임프로트레이딩랩 커뮤니티에서 확인해보세요.";
    const rawImage =
      (post.screenshot_urls && post.screenshot_urls[0]) ||
      post.screenshot_url ||
      null;
    const image = toAbsoluteImage(rawImage);

    return new Response(
      ogHtml({ title, description, image, url: `${SITE_URL}/community/${id}` }),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    console.error("[og-bot] community fetch failed:", e);
    return null;
  }
}
