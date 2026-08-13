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

// 관리자가 (가라회원/지인용으로) 회원 계정을 대신 만들어줄 때도 이메일
// 대신 "아이디"만 받고 싶어서, 관리자 계정과 같은 방식으로 내부용
// 가짜 이메일로 바꿔서 써요. 관리자 계정 도메인이랑 헷갈리지 않게
// 도메인만 다르게 써요.
export const MEMBER_EMAIL_DOMAIN = "member.improtradinglab.app";

export function usernameToMemberEmail(username: string) {
  const normalized = username.trim().toLowerCase();
  return `${normalized}@${MEMBER_EMAIL_DOMAIN}`;
}
