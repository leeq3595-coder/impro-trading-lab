// 커뮤니티 글(수익인증/매매법공유) 본문 맨 끝, 좋아요/댓글 영역 바로 위에
// 항상 고정으로 붙는 거래소 가입 유도 배너예요. 링크는 홈 화면 1번 배너
// (banner1_signup)랑 같은 URL을 써서 관리자에서 하나만 바꾸면 둘 다 같이
// 바뀌어요.
export function ExchangeSignupBanner({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 block rounded-2xl border border-[rgba(96,150,255,0.25)] bg-gradient-to-br from-[#0b1120] to-[#131f38] p-4 no-underline"
    >
      <div className="mb-2 text-base font-bold leading-snug text-white">
        임프로가 이용하는 거래소 가입하기
      </div>
      <p className="mb-4 whitespace-pre-line text-xs leading-relaxed text-[#93a0b8]">
        {"12년 이상 이어온 신뢰의 시스템.\n국제 금융위원회 FinaCom 보상제도를 기반으로 한\n무자본 펀딩 트레이딩, 지금 바로 경험 해보세요."}
      </p>
      <span className="inline-block rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 py-2 text-sm font-bold text-[#04101f]">
        지금 가입하기 →
      </span>
    </a>
  );
}
