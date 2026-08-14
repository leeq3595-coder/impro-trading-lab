import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: middleware.ts는 proxy.ts로 이름이 바뀌었어요 (기능은 동일)
// ⚠️ 카톡 미리보기 봇 감지/응답 로직은 여기서 뺐어요 — proxy.ts가 이
// 배포 환경에서 실행 자체가 안 되는 문제가 있어서(로그로 확인함), 대신
// 각 페이지 컴포넌트 안에서 직접 <title>/<meta> 태그를 렌더링하는
// 방식으로 바꿨어요. 여긴 원래대로 로그인 세션 갱신만 해요.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
