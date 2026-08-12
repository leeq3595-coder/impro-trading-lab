"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
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
