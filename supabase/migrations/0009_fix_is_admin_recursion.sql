-- =========================================================
-- "stack depth limit exceeded" 버그 수정
-- is_admin()이 profiles를 조회하는데, profiles의 RLS 정책 자체가 다시
-- is_admin()을 참조해요 → 관리자가 아닌 "본인 행" 조건으로 빠르게 끝나야 정상인데,
-- 플래너가 조건 순서를 바꿔 평가하면서 무한 재귀에 빠져 스택이 터지는 문제가 있었어요.
-- is_admin()을 SECURITY DEFINER로 만들어서, 내부의 profiles 조회가 RLS를
-- 아예 안 타게(우회하게) 고쳐요 — 재귀 자체가 발생하지 않아요.
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;
