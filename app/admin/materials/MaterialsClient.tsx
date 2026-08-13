"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";
import { revalidatePublicData } from "@/lib/publicDataActions";
import { MediaUploader } from "@/components/MediaUploader";
import { SafeThumb } from "@/components/SafeThumb";

const MATERIAL_CACHE_TAGS = ["public-materials-list"];

// 자료 첨부파일로 흔히 쓰는 형식들 (문서/압축파일 + 혹시 몰라 이미지·영상도 허용)
const FILE_ACCEPT =
  "image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.hwpx,.zip,.txt";

type MaterialRow = {
  id: string;
  title: string;
  category: "매매전략" | "기술적분석";
  description: string | null;
  file_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  is_vip: boolean;
  is_pinned: boolean;
  created_at: string;
};

const EMPTY_FORM = {
  title: "",
  category: "매매전략" as MaterialRow["category"],
  description: "",
  file_url: "",
  video_url: "",
  thumbnail_url: "",
  is_vip: false,
};

// 업로드된 파일 URL에서 원래 파일 이름(확장자 포함)만 뽑아서 보여줘요.
// (저장 경로가 "materials/files/1234-ab12.pdf" 같은 식이라 사람이 보기엔 좀 그래서)
function fileNameFromUrl(url: string) {
  try {
    const last = url.split("/").pop() || url;
    return decodeURIComponent(last);
  } catch {
    return url;
  }
}

export default function MaterialsClient() {
  const supabase = createClient();
  const [rows, setRows] = useState<MaterialRow[]>([]);
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
        .from("materials")
        .select(
          "id,title,category,description,file_url,video_url,thumbnail_url,is_vip,is_pinned,created_at"
        )
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as MaterialRow[]) ?? []);
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

  function openEdit(row: MaterialRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      category: row.category,
      description: row.description ?? "",
      file_url: row.file_url ?? "",
      video_url: row.video_url ?? "",
      thumbnail_url: row.thumbnail_url ?? "",
      is_vip: row.is_vip,
    });
    setFormOpen(true);
  }

  async function submit() {
    if (!form.title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!form.file_url.trim() && !form.video_url.trim()) {
      setError("파일 링크나 영상 링크 중 하나는 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim() || null,
        file_url: form.file_url.trim() || null,
        video_url: form.video_url.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        is_vip: form.is_vip,
      };
      if (editingId) {
        const { error } = await supabase
          .from("materials")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("materials").insert(payload);
        if (error) throw error;
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
      await revalidatePublicData(MATERIAL_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSaving(false);
    }
  }

  async function togglePinned(row: MaterialRow) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("materials")
        .update({ is_pinned: !row.is_pinned })
        .eq("id", row.id);
      if (error) throw error;
      await load();
      await revalidatePublicData(MATERIAL_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: MaterialRow) {
    const ok = window.confirm(`"${row.title}" 자료를 삭제할까요?`);
    if (!ok) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      await revalidatePublicData(MATERIAL_CACHE_TAGS);
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
            + 새 자료 등록
          </button>
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-white">
          자료실 관리
        </h1>
        <p className="mb-6 text-xs text-[#5f6b82]">
          썸네일 이미지랑 첨부파일은 아래 업로드 버튼으로 바로 올리면 링크가
          자동으로 채워져요. 영상은 유튜브 등 외부 링크를 넣어주세요.
        </p>

        {error && <p className="mb-4 text-sm text-[#f87171]">{error}</p>}

        {formOpen && (
          <div className="mb-6 rounded-2xl border border-[rgba(96,150,255,0.25)] bg-[#0b1120] p-5">
            <h2 className="mb-3 text-sm font-bold text-white">
              {editingId ? "자료 수정" : "새 자료 등록"}
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
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="간단 설명 (선택)"
                rows={3}
                className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#93a0b8]">
                  썸네일 이미지 (선택 — 목록에 미리보기로 보여요)
                </span>
                <div className="flex items-center gap-3">
                  {form.thumbnail_url && (
                    <SafeThumb
                      src={form.thumbnail_url}
                      className="h-14 w-14 shrink-0 rounded-lg border border-[rgba(96,150,255,0.25)] object-cover"
                    />
                  )}
                  <MediaUploader
                    folder="materials/thumbnail"
                    label="썸네일 업로드"
                    accept="image/*"
                    onUploaded={(url) =>
                      setForm((f) => ({ ...f, thumbnail_url: url }))
                    }
                  />
                  {form.thumbnail_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, thumbnail_url: "" }))
                      }
                      className="text-xs text-[#f87171] underline"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#93a0b8]">
                  첨부파일 (PDF·문서·압축파일 등 — 회원이 다운로드해요)
                </span>
                {form.file_url && (
                  <div className="flex items-center gap-2 rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2 text-xs text-[#93a0b8]">
                    📎 <span className="truncate">{fileNameFromUrl(form.file_url)}</span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, file_url: "" }))}
                      className="ml-auto shrink-0 text-[#f87171] underline"
                    >
                      삭제
                    </button>
                  </div>
                )}
                <MediaUploader
                  folder="materials/files"
                  label="파일 업로드"
                  accept={FILE_ACCEPT}
                  onUploaded={(url) =>
                    setForm((f) => ({ ...f, file_url: url }))
                  }
                />
              </div>

              <input
                value={form.video_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, video_url: e.target.value }))
                }
                placeholder="영상 링크 URL (선택, 유튜브 등)"
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
                        category: e.target.value as MaterialRow["category"],
                      }))
                    }
                    className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-2 py-1.5 text-sm text-white outline-none"
                  >
                    <option value="매매전략">매매전략</option>
                    <option value="기술적분석">기술적분석</option>
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
            아직 등록된 자료가 없어요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex gap-3 rounded-2xl border border-[rgba(96,150,255,0.18)] bg-[#0b1120] p-4"
            >
              {r.thumbnail_url && (
                <SafeThumb
                  src={r.thumbnail_url}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {r.is_pinned && (
                  <span className="rounded-full bg-[rgba(248,113,113,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
                    📌 상단 고정
                  </span>
                )}
                <span className="rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
                  {r.category}
                </span>
                {r.is_vip && (
                  <span className="rounded-full bg-gradient-to-r from-[#f6d888] to-[#e8b94b] px-2 py-0.5 text-[10px] font-bold text-[#241a04]">
                    VIP
                  </span>
                )}
              </div>
              <div className="mt-1 truncate font-bold text-white">
                {r.title}
              </div>
              {r.description && (
                <div className="mt-1 line-clamp-2 text-xs text-[#93a0b8]">
                  {r.description}
                </div>
              )}
              {r.file_url && (
                <div className="mt-1 truncate text-[11px] text-[#5f6b82]">
                  📎 {fileNameFromUrl(r.file_url)}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
