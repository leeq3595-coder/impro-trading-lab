import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { errorDetail } from "@/lib/errorDetail";

type Purpose = "signup" | "find_email" | "reset_password";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 2))}@${domain}`;
}

export async function POST(req: NextRequest) {
  const {
    phone,
    code,
    userId: bodyUserId,
    purpose = "signup",
    newPassword,
  }: {
    phone: string;
    code: string;
    userId?: string;
    purpose?: Purpose;
    newPassword?: string;
  } = await req.json();

  if (!phone || !code) {
    return NextResponse.json(
      { error: "휴대폰 번호와 인증번호를 입력해주세요." },
      { status: 400 }
    );
  }
  if (purpose === "reset_password" && (!newPassword || newPassword.length < 8)) {
    return NextResponse.json(
      { error: "새 비밀번호는 8자 이상이어야 해요." },
      { status: 400 }
    );
  }

  const cleanPhone = phone.replace(/-/g, "");
  const supabase = createAdminClient();

  const { data: otpRows, error } = await supabase
    .from("phone_otp")
    .select("*")
    .eq("phone", cleanPhone)
    .eq("purpose", purpose)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const otp = otpRows?.[0];
  if (!otp)
    return NextResponse.json(
      { error: "인증 요청 내역이 없어요. 인증번호를 다시 요청해주세요." },
      { status: 400 }
    );
  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "인증번호가 만료됐어요. 다시 요청해주세요." },
      { status: 400 }
    );
  }
  if (otp.attempts >= 5) {
    return NextResponse.json(
      { error: "시도 횟수를 초과했어요. 인증번호를 다시 요청해주세요." },
      { status: 400 }
    );
  }
  if (otp.code !== code) {
    await supabase
      .from("phone_otp")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    return NextResponse.json(
      { error: "인증번호가 일치하지 않아요." },
      { status: 400 }
    );
  }

  await supabase.from("phone_otp").update({ verified: true }).eq("id", otp.id);

  // ===== 회원가입 휴대폰 인증 =====
  if (purpose === "signup") {
    const userId = bodyUserId ?? otp.user_id;
    if (userId) {
      await supabase
        .from("profiles")
        .update({ phone: cleanPhone, phone_verified: true })
        .eq("id", userId);
    }
    return NextResponse.json({ ok: true });
  }

  // ===== 아이디(이메일) 찾기 =====
  if (purpose === "find_email") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", otp.user_id)
      .single();
    if (!profile?.email) {
      return NextResponse.json(
        { error: "가입 정보를 찾을 수 없어요." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, email: maskEmail(profile.email) });
  }

  // ===== 비밀번호 재설정 =====
  if (purpose === "reset_password") {
    if (!otp.user_id) {
      return NextResponse.json(
        { error: "가입 정보를 찾을 수 없어요." },
        { status: 404 }
      );
    }
    try {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        otp.user_id,
        { password: newPassword }
      );
      if (updateError) {
        console.error("[reset-password] update error:", errorDetail(updateError));
        return NextResponse.json(
          { error: `비밀번호 변경 실패: ${updateError.message}` },
          { status: 500 }
        );
      }
    } catch (e) {
      console.error("[reset-password] unexpected throw:", errorDetail(e));
      return NextResponse.json(
        { error: `비밀번호 변경 중 오류: ${errorDetail(e)}` },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "알 수 없는 요청이에요." }, { status: 400 });
}
