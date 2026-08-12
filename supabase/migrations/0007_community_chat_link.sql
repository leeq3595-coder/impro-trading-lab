-- 히든 랜딩페이지 하단 "공식 소통방 입장하기" 버튼이 사용하는 링크.
-- /admin/links 에서 바로 실제 텔레그램/카카오톡 오픈채팅 URL로 바꿔주세요.
insert into public.link_settings (link_key, label, url) values
  ('community_chat', '공식 소통방 입장하기 (랜딩페이지 하단 CTA)', 'https://example.com/community-chat')
on conflict (link_key) do nothing;
