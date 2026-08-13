"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useAuthGate } from "./AuthGateProvider";

export function GatedLink({
  href,
  loggedIn,
  message,
  className,
  children,
  onClick,
  prefetch,
}: {
  href: string;
  loggedIn: boolean;
  message?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  prefetch?: boolean;
}) {
  const { openGate } = useAuthGate();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!loggedIn) {
      e.preventDefault();
      openGate(message);
      return;
    }
    onClick?.();
  }

  return (
    <Link
      href={loggedIn ? href : "#"}
      onClick={handleClick}
      className={className}
      // 비로그인이면 href가 "#"라서 프리패치할 실제 경로가 없어요.
      prefetch={loggedIn ? prefetch : false}
    >
      {children}
    </Link>
  );
}
