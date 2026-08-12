"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { errorDetail } from "@/lib/errorDetail";

export type AdminAuthState = { error?: string } | undefined;

export async function adminLogin(
  _prevState: AdminAuthState,
  formData: FormData
): Promise<AdminAuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();
  let data, error;
  try {
    ({ data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    }));
  } catch (e) {
    console.error("[admin login] unexpected throw:", errorDetail(e));
    return { error: `로그인 중 예외 발생: ${errorDetail(e)}` };
  }
  if (error) {
    console.error("[admin login] supabase auth error:", errorDetail(error));
    return {
      error: `로그인 오류: ${error.message} — 상세: ${errorDetail(error)}`,
    };
  }
  if (!data.user) {
    return { error: "이메일 또는 비밀번호가 올바르지 않아요." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "관리자 계정이 아니에요." };
  }

  redirect("/admin");
}
