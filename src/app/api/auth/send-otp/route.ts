import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendOtpSms } from "@/lib/sms";

// 6자리 인증번호 생성
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

type Purpose = "signup" | "find_email" | "reset_password";

export async function POST(req: NextRequest) {
  const {
    phone,
    userId: bodyUserId,
    purpose = "signup",
  }: { phone: string; userId?: string; purpose?: Purpose } = await req.json();

  if (!phone || !/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ""))) {
    return NextResponse.json(
      { error: "휴대폰 번호 형식이 올바르지 않아요." },
      { status: 400 }
    );
  }
  const cleanPhone = phone.replace(/-/g, "");
  const supabase = createAdminClient();

  let userId = bodyUserId ?? null;

  // 아이디 찾기 / 비밀번호 재설정은 로그인 전이라 userId가 없어요 —
  // 이미 가입 시 인증된 휴대폰번호로 계정을 먼저 찾아야 해요.
  if (purpose === "find_email" || purpose === "reset_password") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("phone_verified", true)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "이 번호로 가입된 계정을 찾을 수 없어요." },
        { status: 404 }
      );
    }
    userId = profile.id;
  }

  const code = genCode();
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분 유효

  const { error: insertError } = await supabase.from("phone_otp").insert({
    phone: cleanPhone,
    code,
    purpose,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // ===== SMS 발송 (해외발신 Twilio 우선, 없으면 국내발신 알리고, 둘 다
  // 없으면 개발모드로 콘솔에 코드만 출력) — 자세한 건 src/lib/sms.ts 참고 =====
  const result = await sendOtpSms(cleanPhone, code, purpose);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  if (result.dev) {
    return NextResponse.json({ ok: true, dev: true, devCode: result.devCode });
  }

  return NextResponse.json({ ok: true });
}
