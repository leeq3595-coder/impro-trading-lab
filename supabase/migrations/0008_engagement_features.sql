-- =========================================================
-- 좋아요/댓글 카운트 자동 동기화 + 글쓰기 포인트 적립
-- 일반 회원이 다른 회원 글에 좋아요/댓글을 남기면 community_posts.likes_count /
-- comments_count 를 업데이트해야 하는데, RLS상 본인 글이 아니면 update가 막혀있어요.
-- 그래서 트리거를 SECURITY DEFINER로 만들어서 RLS를 우회해 카운트만 안전하게 갱신해요.
-- =========================================================

create or replace function public.sync_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.parent_type = 'community_post' then
      update public.community_posts
        set likes_count = likes_count + 1
        where id = new.parent_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.parent_type = 'community_post' then
      update public.community_posts
        set likes_count = greatest(likes_count - 1, 0)
        where id = old.parent_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_likes_count on public.likes;
create trigger trg_sync_likes_count
  after insert or delete on public.likes
  for each row execute procedure public.sync_likes_count();

create or replace function public.sync_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.parent_type = 'community_post' then
      update public.community_posts
        set comments_count = comments_count + 1
        where id = new.parent_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.parent_type = 'community_post' then
      update public.community_posts
        set comments_count = greatest(comments_count - 1, 0)
        where id = old.parent_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_comments_count on public.comments;
create trigger trg_sync_comments_count
  after insert or delete on public.comments
  for each row execute procedure public.sync_comments_count();

-- =========================================================
-- 글쓰기 포인트 적립 (수익인증/매매법공유 작성 시)
-- 포인트 값은 함수 안에 고정돼 있어서, 클라이언트에서 임의의 포인트를 요청할 수 없어요.
-- 필요하면 아래 숫자(10, 20)만 바꿔서 재실행하면 돼요.
-- =========================================================
create or replace function public.award_post_points(p_post_type text, p_ref_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int;
  v_activity text;
begin
  if p_post_type = 'profit_proof' then
    v_points := 10;
    v_activity := 'profit_proof_post';
  elsif p_post_type = 'strategy_share' then
    v_points := 20;
    v_activity := 'strategy_share_post';
  else
    raise exception 'invalid post_type: %', p_post_type;
  end if;

  insert into public.points_ledger (user_id, activity_type, points, ref_type, ref_id)
  values (auth.uid(), v_activity, v_points, 'community_post', p_ref_id);

  update public.profiles
    set points_total = points_total + v_points,
        points_month = points_month + v_points
    where id = auth.uid();
end;
$$;

grant execute on function public.award_post_points(text, uuid) to authenticated;
