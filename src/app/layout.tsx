import type { Metadata } from "next";
import "./globals.css";
import { AuthGateProvider } from "@/components/AuthGateProvider";

// metadataBase가 있어야 칼럼/커뮤니티 상세 페이지에서 상대경로("/xxx.jpg")로
// 넣은 이미지도 카카오톡 미리보기용 절대주소로 자동 변환돼요.
//
// ⚠️ 예전엔 여기에 openGraph/twitter "기본값"도 같이 있었는데, 그게 바로
// 카톡 미리보기가 계속 기본 로고+기본 설명으로만 뜨던 진짜 원인이었어요.
// 이 openGraph/twitter는 Next.js Metadata API가 <head>에 정적으로 박아
// 넣는데, 칼럼/커뮤니티 상세 페이지는 (generateMetadata가 이 배포 환경에서
// 실행이 안 돼서) 페이지 컴포넌트 안에서 React 19 태그 호이스팅으로 og:title
// 같은 태그를 "또" 렌더링했어요. 그 결과 실제 HTML에는 og:title 같은 태그가
// 2개씩(레이아웃 기본값 + 페이지 전용값) 들어갔고, 카카오 스크래퍼가 그중
// 먼저 나오는(=레이아웃 기본값) 쪽을 읽어버린 거예요 — curl로 직접 봤을 땐
// "정상"으로 보였던 이유(둘 다 존재하니까)가 바로 이거였어요.
// 그래서 openGraph/twitter는 여기서 빼고, 홈(page.tsx)이랑 칼럼/커뮤니티
// 상세 페이지가 각자 필요한 og 태그를 직접(중복 없이) 렌더링하도록 바꿨어요.
export const metadata: Metadata = {
  metadataBase: new URL("https://improtradinglab.com"),
  title: "임프로 트레이딩랩",
  description: "임프로 트레이딩랩 — 크립토·트레이딩 교육 및 커뮤니티",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#05070d]">
        <AuthGateProvider>{children}</AuthGateProvider>
      </body>
    </html>
  );
}
