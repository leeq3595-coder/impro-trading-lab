"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { errorDetail } from "@/lib/errorDetail";

export type AuthState = { error?: string } | undefined;

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();
  let error;
  try {
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  } catch (e) {
    console.error("[login] unexpected throw:", errorDetail(e));
    return { error: `로그인 중 예외 발생: ${errorDetail(e)}` };
  }
  if (error) {
    console.error("[login] supabase auth error:", errorDetail(error));
    if (error.message === "fetch failed" || error.status === undefined) {
      return {
        error: `서버 연결 오류: ${error.message} — 상세: ${errorDetail(error)}`,
      };
    }
    return { error: "이메일 또는 비밀번호가 올바르지 않아요." };
  }
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
