"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";

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
  comments_count: number;
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
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(
          "id,post_type,author_id,title,content,symbol,trade_count,seed_amount,profit_amount,profit_rate,screenshot_url,likes_count,comments_count,created_at"
        )
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
      const { error } =
        form.post_type === "profit_proof"
          ? await supabase.from("community_posts").insert({
              post_type: "profit_proof" as const,
              author_id: adminId,
              content: form.content.trim() || null,
              symbol: form.symbol.trim(),
              trade_count: form.trade_count ? Number(form.trade_count) : 0,
              seed_amount: Number(form.seed_amount),
              profit_amount: Number(form.profit_amount),
              screenshot_url: form.screenshot_url.trim() || null,
            })
          : await supabase.from("community_posts").insert({
              post_type: "strategy_share" as const,
              author_id: adminId,
              title: form.title.trim(),
              content: form.content,
            });
      if (error) throw error;
      setFormOpen(false);
      setForm(EMPTY_FORM);
      await load();
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
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormOpen(true);
            }}
            className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 py-2 text-sm font-bold text-[#04101f]"
          >
            + 게시글 등록
          </button>
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-white">
          커뮤니티 관리 (수익인증 · 매매법공유)
        </h1>
        <p className="mb-6 text-xs text-[#5f6b82]">
          관리자 계정({adminNickname}) 이름으로 등록돼요. 초기 콘텐츠 확보용
          기능이에요.
        </p>

        {error && <p className="mb-4 text-sm text-[#f87171]">{error}</p>}

        {formOpen && (
          <div className="mb-6 rounded-2xl border border-[rgba(96,150,255,0.25)] bg-[#0b1120] p-5">
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
                <input
                  value={form.screenshot_url}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      screenshot_url: e.target.value,
                    }))
                  }
                  placeholder="인증 스크린샷 URL (선택)"
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  placeholder="한줄 소감 (선택)"
                  rows={3}
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
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
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  placeholder="매매법 내용"
                  rows={6}
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 py-2 text-sm font-bold text-[#04101f] disabled:opacity-60"
              >
                {saving ? "저장 중..." : "등록"}
              </button>
              <button
                onClick={() => setFormOpen(false)}
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
              <span
                className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  r.post_type === "profit_proof"
                    ? "bg-[rgba(232,120,75,0.16)] text-[#f6a97e]"
                    : "bg-[rgba(96,150,255,0.16)] text-[#8fb3ff]"
                }`}
              >
                {r.post_type === "profit_proof" ? "🔥 수익인증" : "📘 매매법공유"}
              </span>
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
              <div className="mt-3">
                <button
                  onClick={() => remove(r)}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#f87171] underline disabled:opacity-60"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
