"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";
import { useAuthGate } from "./AuthGateProvider";

export function LikeButton({
  postId,
  userId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  userId: string | null;
  initialLiked: boolean;
  initialCount: number;
}) {
  const supabase = createClient();
  const { openGate } = useAuthGate();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!userId) {
      openGate("좋아요는 로그인 후 누를 수 있어요.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    try {
      if (nextLiked) {
        const { error } = await supabase.from("likes").insert({
          parent_type: "community_post",
          parent_id: postId,
          user_id: userId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("parent_type", "community_post")
          .eq("parent_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    } catch (e) {
      // 실패하면 낙관적 업데이트 되돌리기
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
      setError(clientErrorMessage(e, "처리 중 오류가 발생했어요."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
          liked
            ? "bg-[rgba(248,113,113,0.16)] text-[#f87171]"
            : "bg-[rgba(255,255,255,0.06)] text-[#93a0b8]"
        }`}
      >
        <span>{liked ? "❤️" : "🤍"}</span>
        {count}
      </button>
      {error && <p className="text-[11px] text-[#f87171]">{error}</p>}
    </div>
  );
}
