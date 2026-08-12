// 관리자 로그인은 이메일이 아니라 "아이디"로만 하고 싶다는 요청에 맞춰,
// Supabase Auth(이메일 기반)와 호환되도록 아이디를 내부용 가짜 이메일로 변환해서 사용해요.
// 실제 이메일이 아니라서 확인메일이 가지 않고(email_confirm:true로 생성), 사용자는 그냥 "아이디"만 입력하면 돼요.
export const ADMIN_EMAIL_DOMAIN = "admin.improtradinglab.app";

export function usernameToAdminEmail(username: string) {
  const normalized = username.trim().toLowerCase();
  return `${normalized}@${ADMIN_EMAIL_DOMAIN}`;
}
