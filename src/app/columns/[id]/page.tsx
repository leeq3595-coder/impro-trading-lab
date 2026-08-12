import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";
import Link from "next/link";

export const revalidate = 0;

export default async function ColumnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const loggedIn = !!profile;

  const { data: column } = await supabase
    .from("columns")
    .select("id,title,category,is_vip,content,author_id,published_at")
    .eq("id", id)
    .maybeSingle();

  if (!column) notFound();

  let authorNickname = "임쁘로";
  const { data: author } = await supabase
    .from("public_profiles")
    .select("nickname")
    .eq("id", column.author_id)
    .maybeSingle();
  if (author) authorNickname = author.nickname;

  const dateLabel = new Date(column.published_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".");

  // 비로그인 상태에서 VIP 칼럼 직접 접근 → 가입유도 팝업 + 잠금 화면
  if (column.is_vip && !loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        <AutoGate message="VIP 칼럼은 회원만 볼 수 있어요. 간편가입하고 바로 확인해보세요." />
        <header className="sticky top-0 z-40 border-b border-[rgba(96,150,255,0.12)] bg-[#05070d]/95 px-4 py-3 backdrop-blur">
          <Link href="/columns" className="text-sm text-[#93a0b8]">
            ← 칼럼
          </Link>
        </header>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6d888] to-[#e8b94b] text-2xl">
            🔒
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            VIP 전용 칼럼이에요
          </h1>
          <p className="mb-6 text-sm text-[#93a0b8]">
            간편가입하고 VIP 칼럼을 바로 확인해보세요.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-6 py-3 font-bold text-[#04101f]"
          >
            간편가입하기
          </Link>
        </div>
        <BottomNav loggedIn={loggedIn} />
      </main>
    );
  }

  // 로그인은 했지만 VIP 회원이 아닌 경우
  if (column.is_vip && loggedIn && !profile?.is_vip) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        <header className="sticky top-0 z-40 border-b border-[rgba(96,150,255,0.12)] bg-[#05070d]/95 px-4 py-3 backdrop-blur">
          <Link href="/columns" className="text-sm text-[#93a0b8]">
            ← 칼럼
          </Link>
        </header>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6d888] to-[#e8b94b] text-2xl">
            🔒
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            VIP 전용 칼럼이에요
          </h1>
          <p className="mb-6 text-sm text-[#93a0b8]">
            올림프트레이드 가입 후 관리자 확인이 완료되면
            <br />
            VIP 칼럼이 자동으로 열려요.
          </p>
          <Link
            href="/my"
            className="inline-block rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] px-6 py-3 font-bold text-[#04101f]"
          >
            마이페이지에서 확인하기
          </Link>
        </div>
        <BottomNav loggedIn={loggedIn} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="sticky top-0 z-40 border-b border-[rgba(96,150,255,0.12)] bg-[#05070d]/95 px-4 py-3 backdrop-blur">
        <Link href="/columns" className="text-sm text-[#93a0b8]">
          ← 칼럼
        </Link>
      </header>
      <article className="mx-auto max-w-md px-4 py-6">
        <span className="mb-2 inline-block rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
          {column.category}
        </span>
        <h1 className="mb-2 text-xl font-bold leading-snug text-white">
          {column.title}
        </h1>
        <div className="mb-6 text-xs text-[#5f6b82]">
          {authorNickname} · {dateLabel}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#e2e8f5]">
          {column.content}
        </div>
      </article>
      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}
