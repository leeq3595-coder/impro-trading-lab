// 칼럼/커뮤니티 본문에서 카카오톡 등 링크 미리보기용 짧은 설명글을 뽑아내요.
// 이미지/영상 URL만 있는 줄, 소통방 배너 토큰, 마크다운 기호(#, >, !!)는
// 미리보기 설명으로 안 어울리니까 걸러내고 순수 텍스트만 이어붙여요.
export function excerptFromContent(content: string, maxLen = 90): string {
  const lines = content.split("\n");
  const picked: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line === "[[banner]]") continue;
    if (/^https?:\/\/\S+$/.test(line)) continue; // 이미지/영상/링크 단독 줄

    const cleaned = line
      .replace(/^!!\s?/, "")
      .replace(/^>\s?/, "")
      .replace(/^#{1,3}\s+/, "");
    if (cleaned) picked.push(cleaned);
    if (picked.join(" ").length >= maxLen) break;
  }

  const text = picked.join(" ").trim();
  if (!text) return "임프로트레이딩랩에서 확인해보세요.";
  return text.length > maxLen ? text.slice(0, maxLen).trim() + "..." : text;
}

export const SITE_URL = "https://improtradinglab.com";

// 상대경로(/uploads/xxx.png)든 절대경로(https://...)든 무조건 절대 URL로
// 만들어줘요. 카카오톡 같은 미리보기 봇은 상대경로 이미지를 못 읽어서
// og:image는 항상 절대 URL이어야 해요.
export function toAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return `${SITE_URL}/profile-logo.jpg`;
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
