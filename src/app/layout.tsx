import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "임프로 트레이딩랩",
  description: "임프로 트레이딩랩 — 크립토·트레이딩 교육 및 커뮤니티",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
