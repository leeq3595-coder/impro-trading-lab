import Link from "next/link";
import { requireMember } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";

export const revalidate = 0;

export default async function MyScrapsPage() {
  const profile = await requireMember();
  const supabase = await createClient();

  const { data: scrapRows } = await supabase
    .from("scraps")
    .select("column_id,created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const columnIds = (scrapRows ?? []).map((s) => s.column_id);
  type ColumnInfo = {
    id: string;
    title: string;
    category: string;
    is_vip: boolean;
    cover_image_url: string | null;
  };
  let columnsById = new Map<string, ColumnInfo>();
  if (columnIds.length > 0) {
    const { data: columns } = await supabase
      .from("columns")
      .select("id,title,category,is_vip,cover_image_url")
      .in("id", columnIds)
      .returns<ColumnInfo[]>();
    columnsById = new Map((columns ?? []).map((c) => [c.id, c]));
  }

  return (
    <main className="min-h-screen bg-[#05070d] pb-24">
      <header className="sticky top-0 z-40 border-b border-[rgba(96,150,255,0.12)] bg-[#05070d]/95 px-4 py-3 backdrop-blur">
        <Link href="/my" className="text-sm text-[#93a0b8]">
          ← 마이페이지
        </Link>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        <h1 className="mb-4 text-lg font-bold text-white">스크랩한 칼럼</h1>

        <div className="flex flex-col gap-3">
          {(scrapRows ?? []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-[rgba(96,150,255,0.2)] bg-[#0b1120]/50 p-6 text-center text-xs text-[#5f6b82]">
              아직 스크랩한 칼럼이 없어요. 칼럼 상세페이지에서 🔖 버튼을
              눌러보세요.
            </div>
          )}
          {(scrapRows ?? []).map((s) => {
            const c = columnsById.get(s.column_id);
            if (!c) return null;
            return (
              <Link
                key={s.column_id}
                href={`/columns/${c.id}`}
                className="flex items-start gap-3 rounded-2xl border border-[rgba(96,150,255,0.16)] bg-[#0b1120] p-4"
              >
                {c.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.cover_image_url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.15)] text-base">
                    📊
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="mb-1 inline-block rounded-full bg-[rgba(96,150,255,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#8fb3ff]">
                    {c.category}
                  </span>
                  <div className="truncate text-sm font-bold text-white">
                    {c.title}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav loggedIn />
    </main>
  );
}
