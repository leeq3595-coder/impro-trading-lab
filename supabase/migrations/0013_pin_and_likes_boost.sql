-- =========================================================
-- 1) 상단 고정 기능 — 칼럼 / 자료실(교재) / 커뮤니티에 관리자가
--    글을 목록 맨 위로 고정할 수 있게 해요. (히든 랜딩페이지는
--    어차피 목록에 안 보이는 페이지라 대상에서 제외했어요)
-- 2) 커뮤니티 좋아요 "보정값" — 실제 좋아요 토글 기능은 그대로 두고,
--    화면에 노출되는 좋아요 수 = 실제 좋아요수 + 관리자가 입력한 보정값
--    으로 계산해요. (칼럼/히든랜딩의 likes_count와 달리 커뮤니티는
--    실제 좋아요 버튼이 있어서, 값을 통째로 덮어쓰지 않고 보정값을
--    더하는 방식으로 안전하게 처리했어요)
-- =========================================================
alter table public.columns
  add column if not exists is_pinned boolean not null default false;

alter table public.materials
  add column if not exists is_pinned boolean not null default false;

alter table public.community_posts
  add column if not exists is_pinned boolean not null default false;

alter table public.community_posts
  add column if not exists likes_boost integer not null default 0;

create index if not exists columns_pinned_idx
  on public.columns (is_pinned desc, published_at desc);

create index if not exists materials_pinned_idx
  on public.materials (is_pinned desc, created_at desc);

create index if not exists community_posts_pinned_idx
  on public.community_posts (post_type, is_pinned desc, created_at desc);
