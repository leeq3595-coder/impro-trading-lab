-- 관리자 회원검색(아이디=이메일)을 위해 profiles에 email을 복제 저장합니다.
alter table public.profiles add column if not exists email text;

-- 기존 트리거 함수를 email도 같이 넣도록 갱신
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
