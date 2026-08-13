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
//
// auth.getUser()는 매번 Supabase Auth 서버로 네트워크 요청을 보내서 세션을
// 다시 검증해요 — 근데 이 검증은 이미 proxy.ts(미들웨어)가 모든 요청마다
// 한 번씩 해주고 있어요(src/lib/supabase/middleware.ts). 그래서 여기서
// 또 getUser()를 부르면 페이지 하나 볼 때마다 Auth 서버 왕복이 두 번씩
// 발생해서 느려져요. 여기서는 쿠키에 이미 검증된 세션을 그냥 읽기만 하는
// getSession()(네트워크 요청 없음)을 쓰고, 실제 신원 확인은 바로 아래
// profiles 조회의 RLS(auth.uid() = id)가 서버에서 다시 검증해줘요 — 그래서
// 세션 쿠키가 위조되더라도 남의 프로필을 가져올 수는 없어요.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
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
