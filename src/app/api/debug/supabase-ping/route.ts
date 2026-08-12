import { errorDetail } from "@/lib/errorDetail";

// 임시 진단용 라우트예요. supabase-js를 거치지 않고 Supabase Auth 엔드포인트에
// 직접 fetch를 날려서, undici가 주는 진짜 원인(cause 체인)을 그대로 보여줘요.
// 문제 해결되면 이 파일은 지워도 돼요.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL_present: !!url,
    NEXT_PUBLIC_SUPABASE_URL_value: url ?? null,
    NEXT_PUBLIC_SUPABASE_URL_length: url?.length ?? 0,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: !!anon,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_prefix: anon ? anon.slice(0, 12) : null,
    SUPABASE_SERVICE_ROLE_KEY_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    runtime_region: process.env.VERCEL_REGION ?? "unknown",
  };

  if (!url || !anon) {
    return Response.json({ envCheck, fetchTest: "skipped (env missing)" });
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon },
      cache: "no-store",
    });
    const text = await res.text();
    return Response.json({
      envCheck,
      fetchTest: {
        ok: true,
        status: res.status,
        statusText: res.statusText,
        body: text.slice(0, 500),
      },
    });
  } catch (e) {
    return Response.json({
      envCheck,
      fetchTest: {
        ok: false,
        detail: errorDetail(e),
        raw: String(e),
        cause: e instanceof Error ? String((e as Error & { cause?: unknown }).cause) : null,
        causeOfCause:
          e instanceof Error &&
          (e as Error & { cause?: unknown }).cause instanceof Error
            ? String(
                (
                  (e as Error & { cause?: unknown }).cause as Error & {
                    cause?: unknown;
                  }
                ).cause
              )
            : null,
      },
    });
  }
}
