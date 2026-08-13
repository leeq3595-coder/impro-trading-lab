"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCommunityPost } from "@/app/community/write/actions";

// 내가 쓴 글일 때만 상세 페이지에 보이는 수정/삭제 버튼이에요.
export function PostOwnerActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = window.confirm("이 글을 삭제할까요? 삭제하면 되돌릴 수 없어요.");
    if (!ok) return;
    setDeleting(true);
    setError(null);
    const result = await deleteCommunityPost(postId);
    if (result?.error) {
      setDeleting(false);
      setError(result.error);
      return;
    }
    router.push("/community");
    router.refresh();
  }

  return (
    <div className="mb-3 flex items-center gap-2">
      <Link
        href={`/community/${postId}/edit`}
        className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8]"
      >
        수정
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#f87171] underline disabled:opacity-60"
      >
        {deleting ? "삭제 중..." : "삭제"}
      </button>
      {error && <p className="text-xs text-[#f87171]">{error}</p>}
    </div>
  );
}
