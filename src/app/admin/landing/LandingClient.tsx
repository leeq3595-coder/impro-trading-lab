"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";
import { revalidatePublicData } from "@/lib/publicDataActions";
import { MediaUploader } from "@/components/MediaUploader";
import { ContentEditor } from "@/components/ContentEditor";

// 히든 랜딩페이지는 목록(칼럼 목록)에는 안 나오고 상세 캐시만 써요.
const LANDING_CACHE_TAGS = ["public-column-by-id"];

type LandingRow = {
  id: string;
  title: string;
  content: string;
  category: "시황분석" | "종목분석";
  is_vip: boolean;
  is_published: boolean;
  is_hidden: boolean;
  cover_image_url: string | null;
  published_at: string;
  likes_count: number;
};

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "시황분석" as LandingRow["category"],
  is_vip: false,
  is_published: true,
  cover_image_url: "",
  likes_count: 0,
};

export default function LandingClient({ adminId }: { adminId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<LandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function linkFor(row: LandingRow) {
    return `${origin || (typeof window !== "undefined" ? window.location.origin : "")}/columns/${row.id}`;
  }

  async function copyLink(row: LandingRow) {
    const url = linkFor(row);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      window.prompt("아래 링크를 복사해주세요", url);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("columns")
        .select(
          "id,title,content,category,is_vip,is_published,is_hidden,cover_image_url,published_at,likes_count"
        )
        .eq("is_hidden", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      setRows((data as LandingRow[]) ?? []);
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

  function openEdit(row: LandingRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      content: row.content,
      category: row.category,
      is_vip: row.is_vip,
      is_published: row.is_published,
      cover_image_url: row.cover_image_url ?? "",
      likes_count: row.likes_count ?? 0,
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
            is_hidden: true,
            cover_image_url: form.cover_image_url.trim() || null,
            likes_count: form.likes_count,
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
          is_hidden: true,
          cover_image_url: form.cover_image_url.trim() || null,
          likes_count: form.likes_count,
          author_id: adminId,
        });
        if (error) throw error;
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
      await revalidatePublicData(LANDING_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: LandingRow) {
    const ok = window.confirm(`"${row.title}" 랜딩페이지를 삭제할까요?`);
    if (!ok) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("columns")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      await revalidatePublicData(LANDING_CACHE_TAGS);
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
            className="rounded-lg bg-gradient-to-r from-[#f6d888] to-[#e8b94b] px-4 py-2 text-sm font-bold text-[#241a04]"
          >
            + 새 랜딩페이지 작성
          </button>
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-white">
          🔗 히든 랜딩페이지 관리
        </h1>
        <p className="mb-6 text-xs leading-relaxed text-[#5f6b82]">
          여기서 만든 글은 홈/칼럼 목록 어디에도 노출되지 않고, 아래 &quot;링크
          복사&quot; 버튼으로 얻은 주소로만 들어올 수 있어요. 인스타 릴스 → DM
          자동 연동 → 이 링크로 트래픽을 유입시키는 용도예요. 페이지 하단에는
          &quot;다음 칼럼 읽기&quot; / &quot;공식 소통방 입장하기&quot; 고정
          버튼이 자동으로 붙어요.
        </p>

        {error && <p className="mb-4 text-sm text-[#f87171]">{error}</p>}

        {formOpen && (
          <div className="mb-6 rounded-2xl border border-[rgba(232,185,75,0.3)] bg-[#0b1120] p-5">
            <h2 className="mb-3 text-sm font-bold text-white">
              {editingId ? "랜딩페이지 수정" : "새 랜딩페이지 작성"}
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
              <div className="flex flex-col gap-2">
                <input
                  value={form.cover_image_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cover_image_url: e.target.value }))
                  }
                  placeholder="대표 이미지 URL (선택)"
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <MediaUploader
                  folder="landing/cover"
                  label="대표 이미지 업로드"
                  accept="image/*"
                  showCamera
                  onUploaded={(url) =>
                    setForm((f) => ({ ...f, cover_image_url: url }))
                  }
                />
              </div>
              <ContentEditor
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                placeholder="본문 내용 (타이틀/작성자/작성일은 자동으로 상단에 표시돼요)"
                rows={10}
                folder="landing/body"
                showBannerButton
                helpText="강조 박스로 보이게 하려면 그 줄 맨 앞에 !! 를 붙여주세요 (예: !! 놓치면 안 되는 포인트)."
              />
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[#93a0b8]">
                  카테고리
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as LandingRow["category"],
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
                    checked={form.is_published}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        is_published: e.target.checked,
                      }))
                    }
                  />
                  즉시 공개 (꺼두면 링크로도 안 열려요)
                </label>
                <label className="flex items-center gap-2 text-xs text-[#93a0b8]">
                  ❤️ 좋아요 수
                  <input
                    type="number"
                    min={0}
                    value={form.likes_count}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        likes_count: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-24 rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-2 py-1.5 text-sm text-white outline-none focus:border-[#3b82f6]"
                  />
                </label>
              </div>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={submit}
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-[#f6d888] to-[#e8b94b] px-4 py-2 text-sm font-bold text-[#241a04] disabled:opacity-60"
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
            아직 등록된 랜딩페이지가 없어요. 위 버튼으로 첫 페이지를
            작성해보세요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[rgba(232,185,75,0.25)] bg-[#0b1120] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[rgba(232,185,75,0.18)] px-2 py-0.5 text-[10px] font-bold text-[#f6d888]">
                      🔗 히든 랜딩
                    </span>
                    <span className="rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
                      {r.category}
                    </span>
                    {!r.is_published && (
                      <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#5f6b82]">
                        비공개
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate font-bold text-white">
                    {r.title}
                  </div>
                  <div className="mt-1 truncate text-xs text-[#5f6b82]">
                    {linkFor(r)}
                  </div>
                  <div className="mt-1 text-xs text-[#5f6b82]">
                    ❤️ {r.likes_count ?? 0}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => copyLink(r)}
                  className="rounded-lg bg-[rgba(232,185,75,0.14)] px-3 py-1.5 text-xs font-bold text-[#f6d888]"
                >
                  {copiedId === r.id ? "✓ 복사됨" : "🔗 링크 복사"}
                </button>
                <button
                  onClick={() => openEdit(r)}
                  className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 py-1.5 text-xs font-semibold text-[#93a0b8]"
                >
                  수정
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
