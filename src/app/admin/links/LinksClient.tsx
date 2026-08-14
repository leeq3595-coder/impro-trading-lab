"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";
import { revalidatePublicData } from "@/lib/publicDataActions";

const LINK_CACHE_TAGS = ["public-link-settings"];

type LinkRow = { link_key: string; label: string; url: string };

export default function LinksClient() {
  const supabase = createClient();
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("link_settings")
        .select("link_key,label,url")
        .order("link_key");
      if (error) throw error;
      setRows((data as LinkRow[]) ?? []);
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

  async function save(row: LinkRow) {
    const url = drafts[row.link_key] ?? row.url;
    const label = labelDrafts[row.link_key] ?? row.label;
    if (!url.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }
    if (!label.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    setSavingKey(row.link_key);
    setError(null);
    setSavedKey(null);
    try {
      const { error } = await supabase
        .from("link_settings")
        .update({
          url: url.trim(),
          label: label.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("link_key", row.link_key);
      if (error) throw error;
      setRows((prev) =>
        prev.map((r) =>
          r.link_key === row.link_key
            ? { ...r, url: url.trim(), label: label.trim() }
            : r
        )
      );
      setSavedKey(row.link_key);
      setTimeout(() => setSavedKey(null), 1500);
      await revalidatePublicData(LINK_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSavingKey(null);
    }
  }

  async function addNew() {
    if (!newKey.trim() || !newLabel.trim() || !newUrl.trim()) {
      setError("키/이름/URL을 모두 입력해주세요.");
      return;
    }
    setSavingKey("__new__");
    setError(null);
    try {
      const { error } = await supabase.from("link_settings").insert({
        link_key: newKey.trim(),
        label: newLabel.trim(),
        url: newUrl.trim(),
      });
      if (error) throw error;
      setNewKey("");
      setNewLabel("");
      setNewUrl("");
      setAddOpen(false);
      await load();
      await revalidatePublicData(LINK_CACHE_TAGS);
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSavingKey(null);
    }
  }

  const placeholderUrls = rows.filter((r) => r.url.includes("example.com"));

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-sm text-[#93a0b8]">
            ← 관리자 홈
          </Link>
          <button
            onClick={() => setAddOpen((v) => !v)}
            className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 py-2 text-sm font-bold text-[#04101f]"
          >
            + 새 링크 추가
          </button>
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-white">
          바로가기 링크 관리
        </h1>
        <p className="mb-6 text-xs text-[#5f6b82]">
          홈 배너, VIP 시그널 참여 등 앱 곳곳의 외부 링크 URL을 여기서 바꿀 수
          있어요.
        </p>

        {placeholderUrls.length > 0 && (
          <div className="mb-4 rounded-xl border border-[rgba(232,185,75,0.3)] bg-[rgba(232,185,75,0.06)] p-3 text-xs text-[#f6d888]">
            ⚠️ 아직 example.com 임시 URL로 남아있는 링크가{" "}
            {placeholderUrls.length}개 있어요. 실제 링크로 바꿔주세요.
          </div>
        )}

        {error && <p className="mb-4 text-sm text-[#f87171]">{error}</p>}

        {addOpen && (
          <div className="mb-6 rounded-2xl border border-[rgba(96,150,255,0.25)] bg-[#0b1120] p-5">
            <h2 className="mb-3 text-sm font-bold text-white">새 링크 추가</h2>
            <div className="flex flex-col gap-3">
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="link_key (예: banner4_event)"
                className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="이름 (예: 이벤트 배너)"
                className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL"
                className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-3 py-2.5 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
              />
              <div className="flex gap-2">
                <button
                  onClick={addNew}
                  disabled={savingKey === "__new__"}
                  className="rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-4 py-2 text-sm font-bold text-[#04101f] disabled:opacity-60"
                >
                  추가
                </button>
                <button
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg border border-[rgba(96,150,255,0.2)] px-4 py-2 text-sm text-[#93a0b8]"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-[#5f6b82]">불러오는 중...</p>}

        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.link_key}
              className="rounded-2xl border border-[rgba(96,150,255,0.18)] bg-[#0b1120] p-4"
            >
              <div className="mb-1 flex items-center gap-2">
                <input
                  defaultValue={r.label}
                  onChange={(e) =>
                    setLabelDrafts((prev) => ({
                      ...prev,
                      [r.link_key]: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-[rgba(96,150,255,0.18)] bg-[#101a30] px-2 py-1 text-sm font-bold text-white outline-none focus:border-[#3b82f6]"
                />
                <span className="text-[10px] text-[#5f6b82]">
                  {r.link_key}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  defaultValue={r.url}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [r.link_key]: e.target.value,
                    }))
                  }
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6] ${
                    r.url.includes("example.com")
                      ? "border-[rgba(232,185,75,0.4)] bg-[rgba(232,185,75,0.05)]"
                      : "border-[rgba(96,150,255,0.18)] bg-[#101a30]"
                  }`}
                />
                <button
                  onClick={() => save(r)}
                  disabled={savingKey === r.link_key}
                  className="rounded-lg border border-[rgba(96,150,255,0.3)] px-3 text-xs font-semibold text-[#93a0b8] disabled:opacity-60"
                >
                  {savedKey === r.link_key
                    ? "✓ 저장됨"
                    : savingKey === r.link_key
                    ? "저장 중..."
                    : "저장"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
