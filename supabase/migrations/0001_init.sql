-- =========================================================
-- 임프로 트레이딩랩 — 초기 스키마
-- Supabase(Postgres) 기준. auth.users는 Supabase Auth가 관리.
-- =========================================================

-- ---------- 확장 ----------
create extension if not exists "pgcrypto";

-- ---------- 회원 프로필 ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  phone text,
  phone_verified boolean not null default false,
  role text not null default 'member' check (role in ('member','admin')),
  is_vip boolean not null default false,
  vip_since timestamptz,
  olympe_uid text,                       -- 올림프트레이드 UID (관리자 수동 확인용)
  olympe_uid_confirmed boolean not null default false,
  points_total integer not null default 0,   -- 누적 포인트
  points_month integer not null default 0,   -- 이번 달 포인트 (매달 1일 초기화)
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 휴대폰 인증 OTP ----------
create table public.phone_otp (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  purpose text not null default 'signup', -- signup | change_phone
  user_id uuid references auth.users(id) on delete cascade,
  verified boolean not null default false,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on public.phone_otp (phone, verified);

-- ---------- 칼럼 게시판 ----------
create table public.columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null check (category in ('시황분석','종목분석')),
  is_vip boolean not null default false,
  author_id uuid not null references public.profiles(id),
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.columns (published_at desc);

-- ---------- 공지사항 ----------
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notices (is_pinned desc, created_at desc);

-- ---------- 커뮤니티: 수익인증 & 매매법공유 ----------
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  post_type text not null check (post_type in ('profit_proof','strategy_share')),
  author_id uuid not null references public.profiles(id),

  -- 매매법공유
  title text,
  content text,

  -- 수익인증 (자동계산 필드)
  symbol text,
  trade_count integer,
  seed_amount numeric(14,2),
  profit_amount numeric(14,2),
  profit_rate numeric(8,2) generated always as (
    case when seed_amount is not null and seed_amount <> 0
      then round((profit_amount / seed_amount) * 100, 2)
      else null end
  ) stored,
  screenshot_url text,

  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.community_posts (post_type, created_at desc);

-- ---------- 댓글 (칼럼 / 커뮤니티 공용) ----------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('column','community_post')),
  parent_id uuid not null,
  author_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.comments (parent_type, parent_id, created_at);

-- ---------- 좋아요 ----------
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('community_post')),
  parent_id uuid not null,
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (parent_type, parent_id, user_id)
);

-- ---------- 칼럼 스크랩 ----------
create table public.scraps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  column_id uuid not null references public.columns(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, column_id)
);

-- ---------- 교재 자료실 ----------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('매매전략','기술적분석')),
  description text,
  file_url text,
  video_url text,
  thumbnail_url text,
  is_vip boolean not null default false,
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.materials (created_at desc);

-- ---------- 포인트 적립 내역 ----------
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  activity_type text not null check (activity_type in ('profit_proof_post','strategy_share_post','comment','like_received')),
  points integer not null,
  ref_type text,       -- 'community_post' | 'comment' 등
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index on public.points_ledger (user_id, created_at desc);

-- ---------- 월간 리워드 설정 ----------
create table public.monthly_rewards (
  id uuid primary key default gen_random_uuid(),
  month date not null unique,           -- 해당 월 1일 (예: 2026-08-01)
  total_amount numeric(12,2) not null default 0,
  first_amount numeric(12,2) not null default 0,
  second_amount numeric(12,2) not null default 0,
  third_amount numeric(12,2) not null default 0,
  prev_month_amount numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- 바로가기 링크 관리 ----------
create table public.link_settings (
  link_key text primary key,   -- 예: banner1_signup, banner2_prop, mypage_vip_banner ...
  label text not null,
  url text not null,
  updated_at timestamptz not null default now()
);

-- ---------- 알림 설정 ----------
create table public.notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  new_column boolean not null default true,
  notice boolean not null default true,
  materials_update boolean not null default false,
  comment_on_my_post boolean not null default true,
  like_on_my_post boolean not null default false,
  strategy_share_vip boolean not null default true,
  marketing boolean not null default false,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================
alter table public.profiles enable row level security;
alter table public.columns enable row level security;
alter table public.notices enable row level security;
alter table public.community_posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.scraps enable row level security;
alter table public.materials enable row level security;
alter table public.points_ledger enable row level security;
alter table public.monthly_rewards enable row level security;
alter table public.link_settings enable row level security;
alter table public.notification_settings enable row level security;
alter table public.phone_otp enable row level security; -- 정책 없음(기본 차단): service_role(서버)만 접근

-- 관리자 판별 헬퍼
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

-- profiles: 본인 읽기/수정, 관리자는 전체 읽기/수정
create policy "profiles_select_own_or_admin" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- columns: 전체 공개 읽기(제목/미리보기는 프론트에서 VIP 블러 처리), 작성/수정은 관리자만
create policy "columns_select_all" on public.columns for select using (true);
create policy "columns_write_admin" on public.columns for insert with check (public.is_admin());
create policy "columns_update_admin" on public.columns for update using (public.is_admin());
create policy "columns_delete_admin" on public.columns for delete using (public.is_admin());

-- notices: 전체 공개 읽기, 관리자만 작성/수정
create policy "notices_select_all" on public.notices for select using (true);
create policy "notices_write_admin" on public.notices for insert with check (public.is_admin());
create policy "notices_update_admin" on public.notices for update using (public.is_admin());
create policy "notices_delete_admin" on public.notices for delete using (public.is_admin());

-- community_posts: 전체 공개 읽기(본문 VIP 게이팅은 프론트/조회API에서), 로그인 회원 작성, 본인/관리자 수정삭제
create policy "posts_select_all" on public.community_posts for select using (true);
create policy "posts_insert_own" on public.community_posts for insert with check (auth.uid() = author_id);
create policy "posts_update_own_or_admin" on public.community_posts for update using (auth.uid() = author_id or public.is_admin());
create policy "posts_delete_own_or_admin" on public.community_posts for delete using (auth.uid() = author_id or public.is_admin());

-- comments
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments_delete_own_or_admin" on public.comments for delete using (auth.uid() = author_id or public.is_admin());

-- likes
create policy "likes_select_all" on public.likes for select using (true);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

-- scraps
create policy "scraps_select_own" on public.scraps for select using (auth.uid() = user_id);
create policy "scraps_insert_own" on public.scraps for insert with check (auth.uid() = user_id);
create policy "scraps_delete_own" on public.scraps for delete using (auth.uid() = user_id);

-- materials: 전체 공개 읽기, 관리자만 작성/수정
create policy "materials_select_all" on public.materials for select using (true);
create policy "materials_write_admin" on public.materials for insert with check (public.is_admin());
create policy "materials_update_admin" on public.materials for update using (public.is_admin());
create policy "materials_delete_admin" on public.materials for delete using (public.is_admin());

-- points_ledger: 본인/관리자만 조회, 서버(서비스롤)에서만 기록
create policy "points_select_own_or_admin" on public.points_ledger for select using (auth.uid() = user_id or public.is_admin());

-- monthly_rewards: 전체 공개 읽기, 관리자만 수정
create policy "rewards_select_all" on public.monthly_rewards for select using (true);
create policy "rewards_write_admin" on public.monthly_rewards for insert with check (public.is_admin());
create policy "rewards_update_admin" on public.monthly_rewards for update using (public.is_admin());

-- link_settings: 전체 공개 읽기, 관리자만 수정
create policy "links_select_all" on public.link_settings for select using (true);
create policy "links_write_admin" on public.link_settings for insert with check (public.is_admin());
create policy "links_update_admin" on public.link_settings for update using (public.is_admin());

-- notification_settings: 본인만
create policy "notif_select_own" on public.notification_settings for select using (auth.uid() = user_id);
create policy "notif_upsert_own" on public.notification_settings for insert with check (auth.uid() = user_id);
create policy "notif_update_own" on public.notification_settings for update using (auth.uid() = user_id);

-- =========================================================
-- 트리거: 회원가입 시 profiles / notification_settings 자동 생성
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', '회원' || substr(new.id::text, 1, 6)));
  insert into public.notification_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- 초기 링크 시드 (플레이스홀더 — 관리자 페이지에서 실제 URL로 교체)
-- =========================================================
insert into public.link_settings (link_key, label, url) values
  ('banner1_signup', '홈 배너① VIP 안내', 'https://example.com/olympetrade-signup'),
  ('banner2_prop', '홈 배너② 프랍 트레이딩', 'https://example.com/olympe-funded'),
  ('banner3_youtube', '홈 배너③ 임프로 유튜브', 'https://example.com/youtube'),
  ('olympe_funded_detail', '올림프 펀디드 자세히보기', 'https://example.com/olympe-funded-pinned-post'),
  ('vip_signal_telegram', 'VIP 시그널 참여하기', 'https://example.com/telegram-vip-signal'),
  ('mypage_vip_banner', '마이페이지 VIP 배너', 'https://example.com/olympetrade-signup-mypage'),
  ('support_contact', '고객센터 1:1 문의', 'https://example.com/support-telegram')
on conflict (link_key) do nothing;
