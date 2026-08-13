"use client";

import { useEffect } from "react";
import { useAuthGate } from "./AuthGateProvider";

// 서버 컴포넌트 페이지에서 렌더 즉시 가입유도 팝업을 띄우고 싶을 때 사용
export function AutoGate({ message }: { message?: string }) {
  const { openGate } = useAuthGate();
  useEffect(() => {
    openGate(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
