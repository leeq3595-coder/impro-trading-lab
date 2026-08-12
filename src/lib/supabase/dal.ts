import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";

export type Profile = {
  id: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  phone_verified: boolean;
  role: "member" | "admin";
  is_vip: boolean;
  vip_since: string | null;
  olympe_uid: string | null;
  olympe_uid_confirmed: boolean;
  points_total: number;
  points_month: number;
};

// 현재 로그인한 사용자의 profile을 가져옵니다 (렌더 1회당 1번만 실행되도록 캐시)
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
});

// 일반 회원 전용 페이지 가드 — 로그인 안 되어 있으면 /login으로
export async function requireMember(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

// 관리자 전용 페이지 가드 — 로그인 안 되어 있거나 관리자가 아니면 /admin/login으로
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/admin/login");
  return profile;
}
