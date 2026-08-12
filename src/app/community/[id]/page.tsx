import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/dal";
import { BottomNav } from "@/components/BottomNav";
import { AutoGate } from "@/components/AutoGate";

export const revalidate = 0;

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const loggedIn = !!profile;

  const { data: post } = await supabase
    .from("community_posts")
    .select(
      "id,post_type,author_id,title,content,symbol,trade_count,seed_amount,profit_amount,profit_rate,likes_count,comments_count,created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  if (post.post_type === "strategy_share" && !loggedIn) {
    return (
      <main className="min-h-screen bg-[#05070d] pb-24">
        <AutoGate message="매매법공유는 회원만 볼 수 있어요. 간편가입하고 확인해보세요." />
        <header className="sticky top-0 z-40 border-b border-[rgba(96,150,255,0.12)] bg-[#05070d]/95 px-4 py-3 backdrop-blur">
          <Link href="/community" className="text-sm text-[#93a0b8]">
            ← 커뮤니티
          </Link>
        </header>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#3b82f6] text-2xl">
            🔒
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            매매법공유는 회원 전용이에요
          </h1>
          <p className="mb-6 text-sm text-[#93a0b8]">
            간편가입하고 다른 회원들의 매매법을 확인해보세요.
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

  let authorNickname = "회원";
  const { data: author } = await supabase
    .from("public_profiles")
    .select("nickname")
    .eq("id", post.author_id)
    .maybeSingle();
  if (author) authorNickname = author.nickname;

  const dateLabel = new Date(post.created_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".");

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="sticky top-0 z-40 border-b border-[rgba(96,150,255,0.12)] bg-[#05070d]/95 px-4 py-3 backdrop-blur">
        <Link href="/community" className="text-sm text-[#93a0b8]">
          ← 커뮤니티
        </Link>
      </header>
      <article className="mx-auto max-w-md px-4 py-6">
        <span
          className={`mb-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
            post.post_type === "profit_proof"
              ? "bg-[rgba(232,120,75,0.16)] text-[#f6a97e]"
              : "bg-[rgba(96,150,255,0.16)] text-[#8fb3ff]"
          }`}
        >
          {post.post_type === "profit_proof" ? "🔥 수익인증" : "📘 매매법공유"}
        </span>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-[#243352]" />
          <div>
            <div className="text-sm font-bold text-white">
              {authorNickname}
            </div>
            <div className="text-[11px] text-[#5f6b82]">{dateLabel}</div>
          </div>
        </div>

        {post.title && (
          <h1 className="mb-3 text-lg font-bold text-white">{post.title}</h1>
        )}

        {post.post_type === "profit_proof" && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatBox label="종목" value={post.symbol ?? "-"} />
            <StatBox
              label="수익률"
              value={post.profit_rate != null ? `+${post.profit_rate}%` : "-"}
              highlight
            />
            <StatBox label="매매횟수" value={`${post.trade_count ?? 0}회`} />
          </div>
        )}

        {post.content && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#e2e8f5]">
            {post.content}
          </div>
        )}

        <div className="mt-6 flex items-center gap-4 text-sm text-[#93a0b8]">
          <span>❤️ {post.likes_count}</span>
          <span>💬 {post.comments_count}</span>
        </div>
      </article>
      <BottomNav loggedIn={loggedIn} />
    </main>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-3 text-center">
      <div className="mb-0.5 text-[10px] text-[#5f6b82]">{label}</div>
      <div
        className={`text-sm font-bold ${
          highlight ? "text-[#4ade80]" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
