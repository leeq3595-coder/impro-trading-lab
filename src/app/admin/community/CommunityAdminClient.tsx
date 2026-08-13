"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";
import { revalidatePublicData } from "@/lib/publicDataActions";
import { MediaUploader } from "@/components/MediaUploader";
import { ContentEditor } from "@/components/ContentEditor";
import { BoldTextarea } from "@/components/BoldTextarea";

const COMMUNITY_CACHE_TAGS = [
  "public-community-posts",
  "public-community-post-by-id",
];

type PostRow = {
  id: string;
  post_type: "profit_proof" | "strategy_share";
  author_id: string;
  title: string | null;
  content: string | null;
  symbol: string | null;
  trade_count: number | null;
  seed_amount: number | null;
  profit_amount: number | null;
  profit_rate: number | null;
  screenshot_url: string | null;
  likes_count: number;
  likes_boost: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
};

const EMPTY_FORM = {
  post_type: "profit_proof" as PostRow["post_type"],
  title: "",
  content: "",
  symbol: "",
  trade_count: "",
  seed_amount: "",
  profit_amount: "",
  screenshot_url: "",
};

export default function CommunityAdminClient({
  adminId,
  adminNickname,
}: {
  adminId: string;
  adminNickname: string;
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [boostDrafts, setBoostDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(
          "id,post_type,author_id,title,content,symbol,trade_count,seed_amount,profit_amount,profit_rate,screenshot_url,likes_count,likes_boost,comments_count,is_pinned,created_at"
        )
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as PostRow[]) ?? []);
    } catch (e) {
      setError(clientErrorMessage(e, "불러오기 실패"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(row: PostRow) {
    setEditingId(row.id);
    setForm({
      post_type: row.post_type,
      title: row.title ?? "",
      content: row.content ?? "",
      symbol: row.symbol ?? "",
      trade_count: row.trade_count != null ? String(row.trade_count) : "",
      seed_amount: row.seed_amount != null ? String(row.seed_amount) : "",
      profit_amount:
        row.profit_amount != null ? String(row.profit_amount) : "",
      screenshot_url: row.screenshot_url ?? "",
    });
    setFormOpen(true);
  }

  async function submit() {
    setError(null);
    if (form.post_type === "profit_proof") {
      if (!form.symbol.trim() || !form.seed_amount || !form.profit_amount) {
        setError("종목, 시드금액, 수익금액을 입력해주세요.");
        return;
      }
    } else {
      if (!form.title.trim() || !form.content.trim()) {
        setError("제목과 내용을 입력해주세요.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload =
        form.post_type === "profit_proof"
          ? {
              post_type: "profit_proof" as const,
              content: form.content.trim() || null,
              symbol: form.symbol.trim(),
              trade_count: form.trade_count ? Number(form.trade_count) : 0,
              seed_amount: Number(form.seed_amount),
              profit_amount: Number(form.profit_amount),
              screenshot_url: form.screenshot_url.trim() || null,
              title: null,
            }
          : {
              post_type: "strategy_share" as const,
              title: form.title.trim(),
              content: form.content,
              symbol: null,
              trade_count: null,
              seed_amount: null,
              profit_amount: null,
              screenshot_url: null,
            };

      const { error } = editingId
        ? await supabase
            .from("community_posts")
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", editingId)
        : await supabase
            .from("community_posts")
            .insert({ ...payload, author_id: adminId });
      if (error) throw error;
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
      await revalidatePublicData(COMMUNITY_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSaving(false);
    }
  }

  async function togglePinned(row: PostRow) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({ is_pinned: !row.is_pinned })
        .eq("id", row.id);
      if (error) throw error;
      await load();
      await revalidatePublicData(COMMUNITY_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSaving(false);
    }
  }

  // 실제 좋아요(likes 테이블) 값은 그대로 두고, 화면에 노출되는 숫자에
  // 더해질 "보정값"만 관리자가 따로 입력해서 저장해요.
  async function saveBoost(row: PostRow) {
    const draft = boostDrafts[row.id];
    if (draft === undefined) return;
    const value = Math.max(0, Number(draft) || 0);
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({ likes_boost: value })
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, likes_boost: value } : r))
      );
      setBoostDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      await revalidatePublicData(COMMUNITY_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: PostRow) {
    const ok = window.confirm("이 게시글을 삭제할까요?");
    if (!ok) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      await revalidatePublicData(COMMUNITY_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "삭제 중 오류가 발생했어요."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-sm text-[#93a0b8]">
            ← 관리자 홈
          </Link>
          <button
            onClick={openCreate}
            className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 py-2 text-sm font-bold text-[#04101f]"
          >
            + 게시글 등록
          </button>
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-white">
          커뮤니티 관리 (수익인증 · 매매법공유)
        </h1>
        <p className="mb-6 text-xs leading-relaxed text-[#5f6b82]">
          관리자 계정({adminNickname}) 이름으로 등록돼요. 초기 콘텐츠 확보용
          기능이에요. 각 게시글의 &quot;보정값&quot;은 실제 좋아요 수에
          더해져서 화면에 노출돼요 (실제 좋아요 기능은 그대로 유지돼요).
        </p>

        {error && <p className="mb-4 text-sm text-[#f87171]">{error}</p>}

        {formOpen && (
          <div className="mb-6 rounded-2xl border border-[rgba(96,150,255,0.25)] bg-[#0b1120] p-5">
            <h2 className="mb-3 text-sm font-bold text-white">
              {editingId ? "게시글 수정" : "새 게시글 등록"}
            </h2>
            <div className="mb-3 flex gap-2">
              <button
                onClick={() =>
                  setForm((f) => ({ ...f, post_type: "profit_proof" }))
                }
                className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                  form.post_type === "profit_proof"
                    ? "bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-[#04101f]"
                    : "bg-[#101a30] text-[#93a0b8]"
                }`}
              >
                🔥 수익인증
              </button>
              <button
                onClick={() =>
                  setForm((f) => ({ ...f, post_type: "strategy_share" }))
                }
                className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                  form.post_type === "strategy_share"
                    ? "bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-[#04101f]"
                    : "bg-[#101a30] text-[#93a0b8]"
                }`}
              >
                📘 매매법공유
              </button>
            </div>

            {form.post_type === "profit_proof" ? (
              <div className="flex flex-col gap-3">
                <input
                  value={form.symbol}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, symbol: e.target.value }))
                  }
                  placeholder="종목 (예: BTC/USDT)"
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.seed_amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, seed_amount: e.target.value }))
                    }
                    type="number"
                    placeholder="시드 금액 ($)"
                    className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                  />
                  <input
                    value={form.profit_amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        profit_amount: e.target.value,
                      }))
                    }
                    type="number"
                    placeholder="수익 금액 ($)"
                    className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                  />
                </div>
                <input
                  value={form.trade_count}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, trade_count: e.target.value }))
                  }
                  type="number"
                  placeholder="매매 횟수 (선택)"
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <div className="flex flex-col gap-2">
                  <input
                    value={form.screenshot_url}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        screenshot_url: e.target.value,
                      }))
                    }
                    placeholder="인증 스크린샷 URL (선택, 아래 버튼으로 올리면 자동으로 채워져요)"
                    className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                  />
                  <MediaUploader
                    folder="community/screenshot"
                    label="스크린샷 업로드"
                    accept="image/*"
                    showCamera
                    onUploaded={(url) =>
                      setForm((f) => ({ ...f, screenshot_url: url }))
                    }
                  />
                </div>
                <BoldTextarea
                  value={form.content}
                  onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                  placeholder="한줄 소감 (선택)"
                  rows={3}
                />
                <p className="text-[11px] leading-relaxed text-[#5f6b82]">
                  💡 굵게 하고 싶은 부분을 드래그해서 선택한 다음{" "}
                  <b>&quot;B 굵게&quot;</b> 버튼을 누르면 굵은 글씨로 바뀌어요.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="제목"
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <ContentEditor
                  value={form.content}
                  onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                  placeholder="매매법 내용"
                  rows={6}
                  folder="community/body"
                />
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 py-2 text-sm font-bold text-[#04101f] disabled:opacity-60"
              >
                {saving ? "저장 중..." : editingId ? "수정 저장" : "등록"}
              </button>
              <button
                onClick={() => {
                  setFormOpen(false);
                  setEditingId(null);
                }}
                className="rounded-lg border border-[rgba(96,150,255,0.2)] px-4 py-2 text-sm text-[#93a0b8]"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-[#5f6b82]">불러오는 중...</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-[#5f6b82]">
            아직 등록된 게시글이 없어요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[rgba(96,150,255,0.18)] bg-[#0b1120] p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {r.is_pinned && (
                  <span className="inline-block rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
                    📌 상단 고정
                  </span>
                )}
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    r.post_type === "profit_proof"
                      ? "bg-[rgba(232,120,75,0.16)] text-[#f6a97e]"
                      : "bg-[rgba(96,150,255,0.16)] text-[#8fb3ff]"
                  }`}
                >
                  {r.post_type === "profit_proof" ? "🔥 수익인증" : "📘 매매법공유"}
                </span>
              </div>
              {r.post_type === "profit_proof" ? (
                <div className="font-bold text-white">
                  {r.symbol} · +{r.profit_rate ?? 0}% ({r.trade_count ?? 0}회)
                </div>
              ) : (
                <div className="truncate font-bold text-white">
                  {r.title}
                </div>
              )}
              {r.content && (
                <p className="mt-1 line-clamp-2 text-xs text-[#93a0b8]">
                  {r.content}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openEdit(r)}
                  className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8]"
                >
                  수정
                </button>
                <button
                  onClick={() => togglePinned(r)}
                  disabled={saving}
                  className="rounded-lg border border-[rgba(248,113,113,0.35)] px-3 py-1.5 text-xs font-semibold text-[#f87171] disabled:opacity-60"
                >
                  {r.is_pinned ? "📌 고정 해제" : "📌 상단 고정"}
                </button>
                <button
                  onClick={() => remove(r)}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#f87171] underline disabled:opacity-60"
                >
                  삭제
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#93a0b8]">
                <span>
                  ❤️ 실제 {r.likes_count} + 보정 {r.likes_boost} = 노출{" "}
                  {r.likes_count + r.likes_boost}
                </span>
                <input
                  type="number"
                  min={0}
                  value={boostDrafts[r.id] ?? r.likes_boost}
                  onChange={(e) =>
                    setBoostDrafts((prev) => ({
                      ...prev,
                      [r.id]: e.target.value,
                    }))
                  }
                  className="w-20 rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-2 py-1 text-xs text-white outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={() => saveBoost(r)}
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-3 py-1 text-[11px] font-bold text-[#04101f] disabled:opacity-60"
                >
                  보정값 저장
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
