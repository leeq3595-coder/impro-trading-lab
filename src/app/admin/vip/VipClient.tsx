"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clientErrorMessage } from "@/lib/clientError";
import { deleteMember } from "./actions";

type Member = {
  id: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  is_vip: boolean;
  olympe_uid: string | null;
  olympe_uid_confirmed: boolean;
  points_total: number;
  role: string;
};

export default function VipClient() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uidDrafts, setUidDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("profiles")
        .select(
          "id, nickname, email, phone, is_vip, olympe_uid, olympe_uid_confirmed, points_total, role"
        )
        .order("nickname")
        .limit(30);

      if (query.trim()) {
        const t = query.trim();
        q = q.or(
          `nickname.ilike.%${t}%,email.ilike.%${t}%,phone.ilike.%${t}%`
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      setMembers((data as Member[]) ?? []);
    } catch (e) {
      setError(clientErrorMessage(e, "검색 중 오류가 발생했어요."));
    } finally {
      setLoading(false);
    }
  }

  async function toggleVip(m: Member) {
    setSavingId(m.id);
    setError(null);
    try {
      const nextVip = !m.is_vip;
      const { error } = await supabase
        .from("profiles")
        .update({
          is_vip: nextVip,
          vip_since: nextVip ? new Date().toISOString() : null,
        })
        .eq("id", m.id);
      if (error) throw error;
      setMembers((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, is_vip: nextVip } : x))
      );
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSavingId(null);
    }
  }

  async function removeMember(m: Member) {
    const ok = window.confirm(
      `정말 "${m.nickname}" 회원을 삭제(탈퇴 처리)할까요?\n작성한 게시글·댓글·포인트 내역도 함께 삭제되고, 되돌릴 수 없어요.`
    );
    if (!ok) return;
    setSavingId(m.id);
    setError(null);
    try {
      const res = await deleteMember(m.id);
      if (res?.error) throw new Error(res.error);
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      setError(clientErrorMessage(e, "삭제 중 오류가 발생했어요."));
    } finally {
      setSavingId(null);
    }
  }

  async function saveUid(m: Member) {
    const uid = uidDrafts[m.id] ?? m.olympe_uid ?? "";
    setSavingId(m.id);
    setError(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ olympe_uid: uid, olympe_uid_confirmed: true })
        .eq("id", m.id);
      if (error) throw error;
      setMembers((prev) =>
        prev.map((x) =>
          x.id === m.id
            ? { ...x, olympe_uid: uid, olympe_uid_confirmed: true }
            : x
        )
      );
    } catch (e) {
      setError(clientErrorMessage(e, "저장 중 오류가 발생했어요."));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-sm text-[#93a0b8]">
            ← 관리자 홈
          </Link>
          <a
            href="/admin/vip/export"
            className="text-sm font-semibold text-[#4ade80] underline"
          >
            📊 회원목록 엑셀로 내보내기
          </a>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2 mb-1">
          회원 VIP 업그레이드
        </h1>
        <p className="text-xs text-[#5f6b82] mb-6">
          비밀번호는 암호화되어 저장되기 때문에 관리자도 원문을 볼 수 없고,
          엑셀 추출에도 포함되지 않아요 (보안상 정상적인 동작이에요).
        </p>

        <div className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="닉네임 / 이메일 / 전화번호 검색"
            className="flex-1 rounded-xl bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-4 py-3 text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
          />
          <button
            onClick={search}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-5 font-bold text-[#04101f] disabled:opacity-60"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>

        {error && <p className="text-sm text-[#f87171] mb-4">{error}</p>}

        {members.length === 0 && !loading && (
          <p className="text-sm text-[#5f6b82]">
            검색어 없이 검색을 누르면 회원 목록이 최근 순으로 나와요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-[rgba(96,150,255,0.18)] bg-[#0b1120] p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {m.nickname}
                    {m.is_vip && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-gradient-to-r from-[#f6d888] to-[#e8b94b] text-[#241a04]">
                        VIP
                      </span>
                    )}
                    {m.role === "admin" && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-[rgba(96,150,255,0.2)] text-[#93a0b8]">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#5f6b82] mt-1">
                    {m.email} · {m.phone || "휴대폰 미인증"} · 누적{" "}
                    {m.points_total}P
                  </div>
                </div>
                <button
                  onClick={() => toggleVip(m)}
                  disabled={savingId === m.id}
                  className={`text-xs font-bold rounded-full px-3 py-1.5 ${
                    m.is_vip
                      ? "bg-[rgba(255,255,255,0.08)] text-[#93a0b8]"
                      : "bg-gradient-to-r from-[#f6d888] to-[#e8b94b] text-[#241a04]"
                  } disabled:opacity-60`}
                >
                  {m.is_vip ? "VIP 해제" : "VIP로 전환"}
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <input
                  defaultValue={m.olympe_uid ?? ""}
                  onChange={(e) =>
                    setUidDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  placeholder="올림프트레이드 UID"
                  className="flex-1 rounded-lg bg-[#101a30] border border-[rgba(96,150,255,0.18)] px-3 py-2 text-sm text-white placeholder:text-[#5f6b82] outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={() => saveUid(m)}
                  disabled={savingId === m.id}
                  className="text-xs font-semibold rounded-lg px-3 border border-[rgba(96,150,255,0.3)] text-[#93a0b8] disabled:opacity-60"
                >
                  UID 확인 완료
                </button>
              </div>
              {m.olympe_uid_confirmed && (
                <div className="text-[11px] text-[#4ade80] mt-1">
                  ✓ 추천 코드 가입 확인 완료
                </div>
              )}

              <button
                onClick={() => removeMember(m)}
                disabled={savingId === m.id}
                className="mt-3 text-[11px] font-semibold text-[#f87171] underline disabled:opacity-60"
              >
                회원 삭제(탈퇴 처리)
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
