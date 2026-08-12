"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ColumnRow = {
  id: string;
  title: string;
  content: string;
  category: "시황분석" | "종목분석";
  is_vip: boolean;
  is_published: boolean;
  published_at: string;
};

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "시황분석" as ColumnRow["category"],
  is_vip: false,
  is_published: true,
};

export default function ColumnsClient({ adminId }: { adminId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<ColumnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("columns")
        .select(
          "id,title,content,category,is_vip,is_published,published_at"
        )
        .order("published_at", { ascending: false });
      if (error) throw error;
      setRows((data as ColumnRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
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

  function openEdit(row: ColumnRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      content: row.content,
      category: row.category,
      is_vip: row.is_vip,
      is_published: row.is_published,
    });
    setFormOpen(true);
  }

  async function submit() {
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 본문을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("columns")
          .update({
            title: form.title.trim(),
            content: form.content,
            category: form.category,
            is_vip: form.is_vip,
            is_published: form.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("columns").insert({
          title: form.title.trim(),
          content: form.content,
          category: form.category,
          is_vip: form.is_vip,
          is_published: form.is_published,
          author_id: adminId,
        });
        if (error) throw error;
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(row: ColumnRow) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("columns")
        .update({ is_published: !row.is_published })
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, is_published: !r.is_published } : r
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: ColumnRow) {
    const ok = window.confirm(`"${row.title}" 칼럼을 삭제할까요?`);
    if (!ok) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("columns")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 중 오류가 발생했어요.");
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
            + 새 칼럼 작성
          </button>
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-white">칼럼 관리</h1>
        <p className="mb-6 text-xs text-[#5f6b82]">
          VIP 칼럼은 비로그인·비VIP 사용자에게 잠금 처리돼요. 비공개(비공개
          상태)로 두면 앱에 노출되지 않아요.
        </p>

        {error && <p className="mb-4 text-sm text-[#f87171]">{error}</p>}

        {formOpen && (
          <div className="mb-6 rounded-2xl border border-[rgba(96,150,255,0.25)] bg-[#0b1120] p-5">
            <h2 className="mb-3 text-sm font-bold text-white">
              {editingId ? "칼럼 수정" : "새 칼럼 작성"}
            </h2>
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
                placeholder="본문 내용"
                rows={8}
                className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[#93a0b8]">
                  카테고리
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as ColumnRow["category"],
                      }))
                    }
                    className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-2 py-1.5 text-sm text-white outline-none"
                  >
                    <option value="시황분석">시황분석</option>
                    <option value="종목분석">종목분석</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#93a0b8]">
                  <input
                    type="checkbox"
                    checked={form.is_vip}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_vip: e.target.checked }))
                    }
                  />
                  VIP 전용
                </label>
                <label className="flex items-center gap-2 text-xs text-[#93a0b8]">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        is_published: e.target.checked,
                      }))
                    }
                  />
                  즉시 공개
                </label>
              </div>
              <div className="mt-1 flex gap-2">
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
          </div>
        )}

        {loading && <p className="text-sm text-[#5f6b82]">불러오는 중...</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-[#5f6b82]">
            아직 등록된 칼럼이 없어요. 위 버튼으로 첫 칼럼을 작성해보세요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[rgba(96,150,255,0.18)] bg-[#0b1120] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
                      {r.category}
                    </span>
                    {r.is_vip && (
                      <span className="rounded-full bg-gradient-to-r from-[#f6d888] to-[#e8b94b] px-2 py-0.5 text-[10px] font-bold text-[#241a04]">
                        VIP
                      </span>
                    )}
                    {!r.is_published && (
                      <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#5f6b82]">
                        비공개
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate font-bold text-white">
                    {r.title}
                  </div>
                  <div className="mt-1 text-xs text-[#5f6b82]">
                    {new Date(r.published_at)
                      .toISOString()
                      .slice(0, 10)
                      .replace(/-/g, ".")}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => openEdit(r)}
                  className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8]"
                >
                  수정
                </button>
                <button
                  onClick={() => togglePublished(r)}
                  disabled={saving}
                  className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
                >
                  {r.is_published ? "비공개로 전환" : "공개로 전환"}
                </button>
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
