-- =========================================================
-- 공개 프로필 뷰 — 닉네임/아바타/VIP 여부만 노출 (이메일/전화번호/UID 등은 절대 노출 안 함)
-- 칼럼/커뮤니티 게시물 작성자 표시용. 뷰는 소유자(postgres) 권한으로 실행되어
-- profiles 테이블의 엄격한 RLS(본인/관리자만 조회)를 우회해서 딱 이 4개 컬럼만 공개해요.
-- =========================================================
create or replace view public.public_profiles as
select id, nickname, avatar_url, is_vip
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
