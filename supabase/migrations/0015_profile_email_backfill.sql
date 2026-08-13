-- 관리자 페이지(회원 VIP 업그레이드)에서 "column profiles.email does not exist"
-- 오류가 나는 걸 보니, 예전에 드렸던 0002_profile_email.sql이 실서비스 DB에
-- 아직 반영이 안 된 상태예요. 다시 실행해도 안전하니(멱등) 그대로 실행하고,
-- 이미 가입한 기존 회원들의 이메일도 auth.users에서 한 번 채워 넣어줍니다.

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', '회원' || substr(new.id::text, 1, 6)),
    new.email
  );
  insert into public.notification_settings (user_id) values (new.id);
  return new;
end;
$$;

-- 기존 회원들 이메일 채워넣기 (이미 있으면 건드리지 않고, 비어있는 것만 채워요)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is distinct from u.email;
