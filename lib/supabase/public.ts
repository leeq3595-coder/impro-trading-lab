import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 로그인 세션(쿠키)이랑 완전히 무관한 "공개 데이터 전용" 클라이언트예요.
// 칼럼/자료실/커뮤니티 목록처럼 누가 보든 똑같이 보이는 데이터를 캐시해서
// 재사용할 때만 이 클라이언트를 써요 (src/lib/publicData.ts 참고).
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
