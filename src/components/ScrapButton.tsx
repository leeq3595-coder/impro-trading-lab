"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";
import { useAuthGate } from "./AuthGateProvider";

export function ScrapButton({
  columnId,
  userId,
  initialScrapped,
}: {
  columnId: string;
  userId: string | null;
  initialScrapped: boolean;
}) {
  const supabase = createClient();
  const { openGate } = useAuthGate();
  const [scrapped, setScrapped] = useState(initialScrapped);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!userId) {
      openGate("스크랩은 로그인 후 이용할 수 있어요.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    const next = !scrapped;
    setScrapped(next);
    try {
      if (next) {
        const { error } = await supabase.from("scraps").insert({
          user_id: userId,
          column_id: columnId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("scraps")
          .delete()
          .eq("user_id", userId)
          .eq("column_id", columnId);
        if (error) throw error;
      }
    } catch (e) {
      setScrapped(!next);
      setError(clientErrorMessage(e, "처리 중 오류가 발생했어요."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
          scrapped
            ? "bg-[rgba(232,185,75,0.16)] text-[#f6d888]"
            : "bg-[rgba(255,255,255,0.06)] text-[#93a0b8]"
        }`}
      >
        {scrapped ? "🔖 스크랩됨" : "🔖 스크랩"}
      </button>
      {error && <p className="text-[11px] text-[#f87171]">{error}</p>}
    </div>
  );
}
