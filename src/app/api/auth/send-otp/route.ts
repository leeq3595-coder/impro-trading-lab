import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

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

  // ===== 알리고 SMS 발송 =====
  // 알리고(https://smartsms.aligo.in) 가입 + 발신번호 사전등록 후
  // .env.local 에 ALIGO_API_KEY / ALIGO_USER_ID / ALIGO_SENDER_PHONE 채우면 바로 동작.
  const { ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER_PHONE } = process.env;
  if (!ALIGO_API_KEY || !ALIGO_USER_ID || !ALIGO_SENDER_PHONE) {
    // 키가 아직 없으면(개발 중) 콘솔에만 코드 출력하고 성공 처리 — 실서비스 배포 전 반드시 키 채울 것
    console.log(`[OTP-DEV] ${cleanPhone} 인증번호(${purpose}): ${code}`);
    return NextResponse.json({ ok: true, dev: true, devCode: code });
  }

  const form = new URLSearchParams({
    key: ALIGO_API_KEY,
    user_id: ALIGO_USER_ID,
    sender: ALIGO_SENDER_PHONE,
    receiver: cleanPhone,
    msg: `[임프로트레이딩랩] 인증번호는 [${code}] 입니다. 3분 이내에 입력해주세요.`,
    msg_type: "SMS",
  });

  const res = await fetch("https://apis.aligo.in/send/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();
  if (data.result_code !== "1") {
    return NextResponse.json(
      { error: `SMS 발송 실패: ${data.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
