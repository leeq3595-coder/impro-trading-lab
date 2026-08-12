import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버 컴포넌트 / 라우트 핸들러에서 사용하는 Supabase 클라이언트 (RLS 적용, 사용자 세션 기준)
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시 (미들웨어가 세션 갱신을 담당)
          }
        },
      },
    }
  );
}

// 관리자 전용 작업(포인트 적립, VIP 강제 반영 등)에 쓰는 service_role 클라이언트.
// RLS를 우회하므로 절대 클라이언트 번들에 포함되면 안 되고, API 라우트 서버 코드에서만 import.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
