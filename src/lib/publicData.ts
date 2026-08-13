import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "./supabase/public";

// =========================================================
// 로그인 여부/VIP 여부랑 관계없이 "누가 보든 똑같은" 공개 데이터 조회
// 모음이에요. 여기서 캐시해두면 여러 사람이 동시에 봐도 DB는 한 번만
// 맞고 나머지는 캐시된 결과를 나눠 써요. (로그인 여부에 따라 뭘
// 보여줄지 걸러내는 건 이 데이터를 가져다 쓰는 페이지 쪽에서 해요 —
// VIP 잠금, 매매법공유 로그인 게이트 등)
//
// 캐시 시간은 실제 새 글이 올라오는 빈도에 맞춰 넉넉하게 잡았어요
// (칼럼/랜딩 하루 2~3개, 커뮤니티 하루 10개 수준) — 새 글이 화면에
// 뜨기까지 최대 캐시 시간만큼(아래 revalidate 초) 늦게 반영될 수
// 있어요.
// =========================================================

export type PublicColumn = {
  id: string;
  title: string;
  category: string;
  is_vip: boolean;
  is_pinned: boolean;
  author_id: string;
  cover_image_url: string | null;
  published_at: string;
};

export const getPublishedColumns = unstable_cache(
  async (): Promise<PublicColumn[]> => {
    const { data } = await createPublicClient()
      .from("columns")
      .select(
        "id,title,category,is_vip,is_pinned,author_id,cover_image_url,published_at"
      )
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });
    return data ?? [];
  },
  ["public-columns-list"],
  { revalidate: 180, tags: ["public-columns-list"] }
);

export type PublicColumnDetail = {
  id: string;
  title: string;
  category: string;
  is_vip: boolean;
  is_hidden: boolean;
  content: string;
  cover_image_url: string | null;
  author_id: string;
  published_at: string;
  likes_count: number;
};

// 칼럼 상세(히든 랜딩페이지 포함). 히든 랜딩은 링크가 있어야만 들어올 수
// 있어서, 한 번 캐시되면 사실상 계속 그 캐시를 재사용해요.
export const getColumnById = unstable_cache(
  async (id: string): Promise<PublicColumnDetail | null> => {
    const { data } = await createPublicClient()
      .from("columns")
      .select(
        "id,title,category,is_vip,is_hidden,content,cover_image_url,author_id,published_at,likes_count"
      )
      .eq("id", id)
      .maybeSingle();
    return data ?? null;
  },
  ["public-column-by-id"],
  { revalidate: 300, tags: ["public-column-by-id"] }
);

export type PublicMaterial = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_url: string | null;
  video_url: string | null;
  is_vip: boolean;
  is_pinned: boolean;
  created_at: string;
};

export const getMaterialsList = unstable_cache(
  async (): Promise<PublicMaterial[]> => {
    const { data } = await createPublicClient()
      .from("materials")
      .select(
        "id,title,category,description,file_url,video_url,is_vip,is_pinned,created_at"
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    return data ?? [];
  },
  ["public-materials-list"],
  { revalidate: 300, tags: ["public-materials-list"] }
);

export type PublicCommunityPost = {
  id: string;
  post_type: "profit_proof" | "strategy_share";
  author_id: string;
  title: string | null;
  content: string | null;
  symbol: string | null;
  trade_count: number | null;
  seed_amount: number | null;
  profit_amount: number | null;
  profit_rate: number | null;
  screenshot_url: string | null;
  likes_count: number;
  likes_boost: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
};

const COMMUNITY_POST_COLUMNS =
  "id,post_type,author_id,title,content,symbol,trade_count,seed_amount,profit_amount,profit_rate,screenshot_url,likes_count,likes_boost,comments_count,is_pinned,created_at";

// 커뮤니티 게시글 전체(수익인증 + 매매법공유 둘 다 섞여서). 홈 미리보기 /
// 커뮤니티 목록(전체보기·수익인증·매매법공유 탭) 전부 이 데이터 하나를
// 나눠서 각자 필터링/정렬해요 — DB 조회 자체는 한 곳에서만 해요.
export const getAllCommunityPosts = unstable_cache(
  async (): Promise<PublicCommunityPost[]> => {
    const { data } = await createPublicClient()
      .from("community_posts")
      .select(COMMUNITY_POST_COLUMNS)
      .order("created_at", { ascending: false });
    return data ?? [];
  },
  ["public-community-posts"],
  { revalidate: 60, tags: ["public-community-posts"] }
);

export const getCommunityPostById = unstable_cache(
  async (id: string): Promise<PublicCommunityPost | null> => {
    const { data } = await createPublicClient()
      .from("community_posts")
      .select(COMMUNITY_POST_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    return data ?? null;
  },
  ["public-community-post-by-id"],
  { revalidate: 60, tags: ["public-community-post-by-id"] }
);

// 홈 배너 / 히든랜딩 소통방 링크 등 "바로가기 링크" 전체. 관리자가 거의
// 안 바꾸는 데이터라 넉넉하게 캐시해요.
export const getAllLinkSettings = unstable_cache(
  async (): Promise<{ link_key: string; url: string }[]> => {
    const { data } = await createPublicClient()
      .from("link_settings")
      .select("link_key,url");
    return data ?? [];
  },
  ["public-link-settings"],
  { revalidate: 300, tags: ["public-link-settings"] }
);

export const getPinnedNotice = unstable_cache(
  async (): Promise<{ id: string; title: string } | null> => {
    const { data } = await createPublicClient()
      .from("notices")
      .select("id,title")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  },
  ["public-pinned-notice"],
  { revalidate: 120, tags: ["public-pinned-notice"] }
);
