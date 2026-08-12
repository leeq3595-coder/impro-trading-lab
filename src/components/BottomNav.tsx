"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GatedLink } from "./GatedLink";

const ICONS = {
  home: "🏠",
  columns: "📈",
  community: "💬",
  materials: "📁",
  my: "👤",
};

export function BottomNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium ${
      active ? "text-[#38bdf8]" : "text-[#5f6b82]"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(96,150,255,0.14)] bg-[#070b16]/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch">
        <Link href="/" className={itemClass(isActive("/"))}>
          <span className="text-lg">{ICONS.home}</span>홈
        </Link>
        <Link href="/columns" className={itemClass(isActive("/columns"))}>
          <span className="text-lg">{ICONS.columns}</span>칼럼
        </Link>
        <Link href="/community" className={itemClass(isActive("/community"))}>
          <span className="text-lg">{ICONS.community}</span>커뮤니티
        </Link>
        <GatedLink
          href="/materials"
          loggedIn={loggedIn}
          message="자료실은 회원만 볼 수 있어요. 간편가입하고 무료 자료부터 확인해보세요."
          className={itemClass(isActive("/materials"))}
        >
          <span className="text-lg">{ICONS.materials}</span>자료실
        </GatedLink>
        <GatedLink
          href="/my"
          loggedIn={loggedIn}
          message="마이페이지는 로그인 후 이용할 수 있어요."
          className={itemClass(isActive("/my"))}
        >
          <span className="text-lg">{ICONS.my}</span>MY
        </GatedLink>
      </div>
    </nav>
  );
}
