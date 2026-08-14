import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  OG_BOT_UA_RE,
  buildColumnOgResponse,
  buildCommunityOgResponse,
} from "@/lib/ogBotResponse";

// Next.js 16: middleware.ts는 proxy.ts로 이름이 바뀌었어요 (기능은 동일)
export async function middleware(request: NextRequest) {
  // ⚠️ proxy(구 미들웨어)가 프로덕션에서 아예 실행되는지부터 확인하려고
  // 무조건 찍는 로그예요. 봇이든 사람이든 이 경로로 들어오는 모든 요청마다
  // 찍혀요. Vercel "Logs" 탭에서 "MIDDLEWARE-CALLED"로 검색해서 확인하세요.
  console.error(
    "MIDDLEWARE-CALLED",
    request.nextUrl.pathname,
    "ua=" + (request.headers.get("user-agent") || ""),
    new Date().toISOString()
  );
  // ⭐ 카카오톡 등 링크 미리보기 봇 전용 처리 ⭐
  // generateMetadata가 이 프로젝트 배포 환경에서 원인 불명으로 실행이
  // 안 되는 문제가 있어서(오랫동안 로그까지 찍어가며 디버깅했지만 결국
  // 원인을 못 찾았어요), 대신 여기 미들웨어에서 봇 User-Agent를 직접
  // 감지해서 그 요청에만 Supabase에서 데이터를 바로 가져와 og:title/
  // og:image가 다 채워진 완성된 HTML을 즉시 만들어 돌려줘요. 실제 사람이
  // 브라우저로 접속하는 요청은 이 분기를 안 타고 평소처럼 앱이 그대로
  // 열려요.
  const ua = request.headers.get("user-agent") || "";
  if (OG_BOT_UA_RE.test(ua)) {
    const { pathname } = request.nextUrl;
    const columnMatch = pathname.match(/^\/columns\/([^/]+)\/?$/);
    const communityMatch = pathname.match(/^\/community\/([^/]+)\/?$/);

    if (columnMatch) {
      const res = await buildColumnOgResponse(columnMatch[1]);
      if (res) return res;
    } else if (communityMatch) {
      const res = await buildCommunityOgResponse(communityMatch[1]);
      if (res) return res;
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
