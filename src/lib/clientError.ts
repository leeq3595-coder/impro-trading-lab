// supabase-js가 던지는 에러(PostgrestError/AuthError 등)는 실행 환경에 따라
// `instanceof Error`가 false로 나올 때가 있어요 (message/details/hint/code만 있는 순수 객체인 경우).
// 그래서 "instanceof Error"로만 분기하면 진짜 에러 메시지가 사라지고 뭉뚱그린
// 안내문구만 보이게 돼요 — 이 함수는 어떤 형태로 오든 실제 메시지를 최대한 뽑아내요.
export function clientErrorMessage(e: unknown, fallback = "오류가 발생했어요."): string {
  if (e instanceof Error && e.message) return e.message;

  if (e && typeof e === "object") {
    const anyE = e as Record<string, unknown>;
    const parts = [anyE.message, anyE.details, anyE.hint, anyE.code]
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    if (parts.length > 0) return parts.join(" — ");
  }

  if (typeof e === "string" && e) return e;

  try {
    const json = JSON.stringify(e);
    if (json && json !== "{}") return json;
  } catch {
    // ignore
  }

  return fallback;
}
