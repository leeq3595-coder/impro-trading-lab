-- 관리자가 회원을 삭제(탈퇴 처리)하면 그 회원이 작성한 데이터도 함께 정리되도록
-- profiles를 참조하는 외래키들을 ON DELETE CASCADE로 바꿉니다.
-- (칼럼/공지/자료실은 보통 관리자만 작성하지만, 일관성을 위해 동일하게 적용합니다)

alter table public.columns drop constraint if exists columns_author_id_fkey;
alter table public.columns add constraint columns_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.notices drop constraint if exists notices_author_id_fkey;
alter table public.notices add constraint notices_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.community_posts drop constraint if exists community_posts_author_id_fkey;
alter table public.community_posts add constraint community_posts_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.comments drop constraint if exists comments_author_id_fkey;
alter table public.comments add constraint comments_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.likes drop constraint if exists likes_user_id_fkey;
alter table public.likes add constraint likes_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.scraps drop constraint if exists scraps_user_id_fkey;
alter table public.scraps add constraint scraps_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.materials drop constraint if exists materials_author_id_fkey;
alter table public.materials add constraint materials_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.points_ledger drop constraint if exists points_ledger_user_id_fkey;
alter table public.points_ledger add constraint points_ledger_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
