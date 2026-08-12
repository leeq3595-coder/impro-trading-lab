"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type NoticeRow = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};

const EMPTY_FORM = { title: "", content: "", is_pinned: false };

export default function NoticesClient({ adminId }: { adminId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<NoticeRow[]>([]);
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
        .from("notices")
        .select("id,title,content,is_pinned,created_at")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as NoticeRow[]) ?? []);
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

  function openEdit(row: NoticeRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      content: row.content,
      is_pinned: row.is_pinned,
    });
    setFormOpen(true);
  }

  async function submit() {
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("notices")
          .update({
            title: form.title.trim(),
            content: form.content,
            is_pinned: form.is_pinned,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notices").insert({
          title: form.title.trim(),
          content: form.content,
          is_pinned: form.is_pinned,
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

  async function togglePin(row: NoticeRow) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notices")
        .update({ is_pinned: !row.is_pinned })
        .eq("id", row.id);
      if (error) throw error;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: NoticeRow) {
    const ok = window.confirm(`"${row.title}" 공지를 삭제할까요?`);
    if (!ok) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notices")
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
            + 새 공지 작성
          </button>
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-white">
          공지사항 관리
        </h1>
        <p className="mb-6 text-xs text-[#5f6b82]">
          상단고정 공지는 홈 화면 공지 배너에 표시돼요.
        </p>

        {error && <p className="mb-4 text-sm text-[#f87171]">{error}</p>}

        {formOpen && (
          <div className="mb-6 rounded-2xl border border-[rgba(96,150,255,0.25)] bg-[#0b1120] p-5">
            <h2 className="mb-3 text-sm font-bold text-white">
              {editingId ? "공지 수정" : "새 공지 작성"}
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
                placeholder="내용"
                rows={5}
                className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <label className="flex items-center gap-2 text-xs text-[#93a0b8]">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_pinned: e.target.checked }))
                  }
                />
                상단 고정 (홈 화면 공지 배너에 표시)
              </label>
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
            아직 등록된 공지가 없어요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[rgba(96,150,255,0.18)] bg-[#0b1120] p-4"
            >
              <div className="flex items-center gap-2">
                {r.is_pinned && (
                  <span className="rounded-full bg-[rgba(232,185,75,0.18)] px-2 py-0.5 text-[10px] font-bold text-[#f6d888]">
                    📌 고정
                  </span>
                )}
                <span className="truncate font-bold text-white">
                  {r.title}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-[#93a0b8]">
                {r.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => openEdit(r)}
                  className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8]"
                >
                  수정
                </button>
                <button
                  onClick={() => togglePin(r)}
                  disabled={saving}
                  className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
                >
                  {r.is_pinned ? "고정 해제" : "상단 고정"}
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
