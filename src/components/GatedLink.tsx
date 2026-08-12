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
}: {
  href: string;
  loggedIn: boolean;
  message?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
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
    <Link href={loggedIn ? href : "#"} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
