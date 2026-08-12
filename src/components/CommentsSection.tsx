"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postComment, deleteComment } from "@/lib/commentsActions";
import { clientErrorMessage } from "@/lib/clientError";
import { useAuthGate } from "./AuthGateProvider";

export type CommentItem = {
  id: string;
  author_id: string;
  authorNickname: string;
  content: string;
  created_at: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toISOString().slice(5, 10).replace("-", ".");
}

export function CommentsSection({
  parentType,
  parentId,
  path,
  loggedIn,
  currentUserId,
  comments,
}: {
  parentType: "column" | "community_post";
  parentId: string;
  path: string;
  loggedIn: boolean;
  currentUserId: string | null;
  comments: CommentItem[];
}) {
  const router = useRouter();
  const { openGate } = useAuthGate();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!loggedIn) {
      openGate("댓글은 로그인 후 남길 수 있어요.");
      return;
    }
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await postComment(parentType, parentId, text, path);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setText("");
        router.refresh();
      } catch (e) {
        setError(clientErrorMessage(e, "등록 실패"));
      }
    });
  }

  function remove(commentId: string) {
    const ok = window.confirm("댓글을 삭제할까요?");
    if (!ok) return;
    startTransition(async () => {
      try {
        const res = await deleteComment(commentId, path);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        router.refresh();
      } catch (e) {
        setError(clientErrorMessage(e, "삭제 실패"));
      }
    });
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-bold text-white">
        댓글 {comments.length}
      </h2>

      <div className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={loggedIn ? "댓글을 남겨보세요" : "로그인 후 댓글을 남길 수 있어요"}
          className="flex-1 rounded-xl border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
        />
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 text-sm font-bold text-[#04101f] disabled:opacity-60"
        >
          등록
        </button>
      </div>

      {error && <p className="mb-3 text-xs text-[#f87171]">{error}</p>}

      <div className="flex flex-col gap-3">
        {comments.length === 0 && (
          <p className="text-xs text-[#5f6b82]">
            아직 댓글이 없어요. 첫 댓글을 남겨보세요.
          </p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[rgba(96,150,255,0.12)] bg-[#0b1120] p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {c.authorNickname}
              </span>
              <span className="text-[10px] text-[#5f6b82]">
                {timeAgo(c.created_at)}
              </span>
              {currentUserId === c.author_id && (
                <button
                  onClick={() => remove(c.id)}
                  disabled={pending}
                  className="ml-auto text-[10px] text-[#f87171] underline disabled:opacity-60"
                >
                  삭제
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm text-[#e2e8f5]">
              {c.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
