import type { Metadata } from "next";
import "./globals.css";
import { AuthGateProvider } from "@/components/AuthGateProvider";

// metadataBase가 있어야 칼럼/커뮤니티 상세 페이지에서 상대경로("/xxx.jpg")로
// 넣은 이미지도 카카오톡 미리보기용 절대주소로 자동 변환돼요. 여기 적어둔
// openGraph/twitter 값은 "기본값"이라, 칼럼·수익인증 상세 페이지처럼
// generateMetadata를 따로 두는 곳에서는 그쪽 값으로 덮어써져요.
export const metadata: Metadata = {
  metadataBase: new URL("https://improtradinglab.com"),
  title: "임프로 트레이딩랩",
  description: "임프로 트레이딩랩 — 크립토·트레이딩 교육 및 커뮤니티",
  openGraph: {
    title: "임프로 트레이딩랩",
    description: "임프로 트레이딩랩 — 크립토·트레이딩 교육 및 커뮤니티",
    siteName: "임프로 트레이딩랩",
    url: "https://improtradinglab.com",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/profile-logo.jpg",
        width: 256,
        height: 256,
        alt: "임프로트레이딩랩 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "임프로 트레이딩랩",
    description: "임프로 트레이딩랩 — 크립토·트레이딩 교육 및 커뮤니티",
    images: ["/profile-logo.jpg"],
  },
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
