// 관리자 로그인은 이메일이 아니라 "아이디"로만 하고 싶다는 요청에 맞춰,
// Supabase Auth(이메일 기반)와 호환되도록 아이디를 내부용 가짜 이메일로 변환해서 사용해요.
// 실제 이메일이 아니라서 확인메일이 가지 않고(email_confirm:true로 생성), 사용자는 그냥 "아이디"만 입력하면 돼요.
export const ADMIN_EMAIL_DOMAIN = "admin.improtradinglab.app";

export function usernameToAdminEmail(username: string) {
  const normalized = username.trim().toLowerCase();
  return `${normalized}@${ADMIN_EMAIL_DOMAIN}`;
}

// 관리자 계정을 새로 만들 때 반드시 알아야 하는 "생성 비밀번호"예요.
// 이 값을 정확히 입력해야만 /admin/setup에서 관리자 계정이 만들어져요
// (아무나 그 페이지 주소를 알아내도 계정을 못 만들게 막는 용도).
// 서버 코드 안에만 있고 브라우저로는 전달되지 않아요.
export const ADMIN_SETUP_SECRET = "5522ldsaA!!";
