import "server-only";

// 문자 발송 — 두 방식을 다 지원해요. TWILIO_* 환경변수가 있으면
// 그걸 우선 쓰고(해외발신), 없고 ALIGO_* 가 있으면 그걸 쓰고(국내발신),
// 둘 다 없으면 개발 모드로 콘솔에만 코드를 찍어요.
//
// ⚠️ 해외발신(Twilio) 주의사항 — 국내 통신사가 스미싱(문자사기) 예방
// 차원에서 해외 경로로 오는 문자를 종종 차단하거나 늦게 전달해요. 회원가입
// 인증문자처럼 "꼭 바로 와야 하는" 문자에는 국내 발신(알리고 등)이 훨씬
// 안정적이에요. 그래도 해외발신을 쓰기로 하셨으니 일단 이렇게 붙여두고,
// 실제로 문자가 잘 오는지 꼭 여러 번 테스트해보세요 — 안 오면 언제든
// 알리고 키만 채워 넣으면 자동으로 국내발신으로 바뀌어요(코드 수정 불필요).

export type SmsResult =
  | { ok: true; dev?: false }
  | { ok: true; dev: true; devCode?: string }
  | { ok: false; error: string };

// 01012345678 → +821012345678 (Twilio는 국제형식(E.164)만 받아요)
function toE164Kr(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  return `+82${withoutLeadingZero}`;
}

async function sendViaTwilio(phone: string, message: string): Promise<SmsResult> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { ok: false, error: "Twilio 환경변수 미설정" };
  }

  const form = new URLSearchParams({
    To: toE164Kr(phone),
    From: TWILIO_FROM_NUMBER,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
      },
      body: form.toString(),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      error: `Twilio 발송 실패: ${data.message || res.statusText}`,
    };
  }
  return { ok: true };
}

async function sendViaAligo(phone: string, message: string): Promise<SmsResult> {
  const { ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER_PHONE } = process.env;
  if (!ALIGO_API_KEY || !ALIGO_USER_ID || !ALIGO_SENDER_PHONE) {
    return { ok: false, error: "알리고 환경변수 미설정" };
  }

  const form = new URLSearchParams({
    key: ALIGO_API_KEY,
    user_id: ALIGO_USER_ID,
    sender: ALIGO_SENDER_PHONE,
    receiver: phone,
    msg: message,
    msg_type: "SMS",
  });

  const res = await fetch("https://apis.aligo.in/send/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();
  if (data.result_code !== "1") {
    return { ok: false, error: `알리고 발송 실패: ${data.message}` };
  }
  return { ok: true };
}

export async function sendOtpSms(
  phone: string,
  code: string,
  purpose: string
): Promise<SmsResult> {
  // Twilio(해외발신)는 영어로, 알리고(국내발신)는 한글로 — 해외 번호에서
  // 한글 문자가 오면 오히려 더 스팸처럼 보일 수 있어서 발신 방식에 맞춰
  // 문구를 다르게 써요.
  const messageEn = `[Impro Trading Lab] Your verification code is ${code}. It expires in 3 minutes.`;
  const messageKo = `[임프로트레이딩랩] 인증번호는 [${code}] 입니다. 3분 이내에 입력해주세요.`;

  const hasTwilio =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_FROM_NUMBER;
  const hasAligo =
    !!process.env.ALIGO_API_KEY &&
    !!process.env.ALIGO_USER_ID &&
    !!process.env.ALIGO_SENDER_PHONE;

  if (hasTwilio) return sendViaTwilio(phone, messageEn);
  if (hasAligo) return sendViaAligo(phone, messageKo);

  // 키가 아직 하나도 없으면(개발 중) 콘솔에만 코드 출력하고 성공 처리
  console.log(`[OTP-DEV] ${phone} 인증번호(${purpose}): ${code}`);
  return { ok: true, dev: true, devCode: code };
}
