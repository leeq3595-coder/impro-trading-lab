import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { phone, code, userId } = await req.json();
  if (!phone || !code) {
    return NextResponse.json({ error: "휴대폰 번호와 인증번호를 입력해주세요." }, { status: 400 });
  }
  const cleanPhone = phone.replace(/-/g, "");
  const supabase = createAdminClient();

  const { data: otpRows, error } = await supabase
    .from("phone_otp")
    .select("*")
    .eq("phone", cleanPhone)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const otp = otpRows?.[0];
  if (!otp) return NextResponse.json({ error: "인증 요청 내역이 없어요. 인증번호를 다시 요청해주세요." }, { status: 400 });
  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: "인증번호가 만료됐어요. 다시 요청해주세요." }, { status: 400 });
  }
  if (otp.attempts >= 5) {
    return NextResponse.json({ error: "시도 횟수를 초과했어요. 인증번호를 다시 요청해주세요." }, { status: 400 });
  }
  if (otp.code !== code) {
    await supabase.from("phone_otp").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return NextResponse.json({ error: "인증번호가 일치하지 않아요." }, { status: 400 });
  }

  await supabase.from("phone_otp").update({ verified: true }).eq("id", otp.id);

  if (userId) {
    await supabase
      .from("profiles")
      .update({ phone: cleanPhone, phone_verified: true })
      .eq("id", userId);
  }

  return NextResponse.json({ ok: true });
}
