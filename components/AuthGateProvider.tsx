"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";

type GateContextType = {
  openGate: (message?: string) => void;
};

const GateContext = createContext<GateContextType | null>(null);

const DEFAULT_MESSAGE = "로그인하고 계속 이용해보세요";

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const openGate = useCallback((msg?: string) => {
    setMessage(msg || DEFAULT_MESSAGE);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <GateContext.Provider value={{ openGate }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={close}
        >
          <div
            className="w-full rounded-t-3xl border border-[rgba(96,150,255,0.25)] bg-[#0b1324] p-6 pb-8 sm:max-w-sm sm:rounded-3xl sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[rgba(255,255,255,0.15)] sm:hidden" />
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#3b82f6] text-2xl">
                🔒
              </div>
              <h2 className="mb-1 text-lg font-bold text-white">
                회원만 볼 수 있어요
              </h2>
              <p className="mb-6 text-sm text-[#93a0b8]">{message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/signup"
                onClick={close}
                className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] py-3 text-center font-bold text-[#04101f]"
              >
                간편가입하고 계속보기
              </Link>
              <Link
                href="/login"
                onClick={close}
                className="rounded-xl border border-[rgba(96,150,255,0.25)] py-3 text-center font-semibold text-[#c9d3e6]"
              >
                이미 계정이 있어요 (로그인)
              </Link>
              <button
                onClick={close}
                className="mt-1 py-2 text-center text-xs text-[#5f6b82]"
              >
                나중에 할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </GateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(GateContext);
  if (!ctx) {
    throw new Error("useAuthGate must be used within AuthGateProvider");
  }
  return ctx;
}
