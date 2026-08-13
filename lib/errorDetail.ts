// undici/fetch 에러는 진짜 원인이 .cause 체인 안에 숨어있어서,
// "fetch failed" 라는 겉 메시지만으로는 원인을 알 수 없어요.
// 이 함수는 .cause를 끝까지 따라가면서 실제 원인(ENOTFOUND, ECONNREFUSED, 인증서 오류 등)을 문자열로 뽑아줘요.
export function errorDetail(err: unknown): string {
  const parts: string[] = [];
  let cur: unknown = err;
  let depth = 0;
  while (cur && depth < 6) {
    if (cur instanceof Error) {
      parts.push(`${cur.name}: ${cur.message}`);
      cur = (cur as Error & { cause?: unknown }).cause;
    } else if (typeof cur === "object") {
      try {
        parts.push(JSON.stringify(cur));
      } catch {
        parts.push(String(cur));
      }
      cur = undefined;
    } else {
      parts.push(String(cur));
      cur = undefined;
    }
    depth++;
  }
  return parts.join(" ← caused by: ");
}
