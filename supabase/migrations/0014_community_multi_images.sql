-- 커뮤니티 "수익인증" 글에 스크린샷을 여러 장(최대 5장) 올릴 수 있도록
-- screenshot_urls 배열 컬럼을 추가합니다.
-- 기존 screenshot_url(단일 URL) 컬럼은 하위 호환을 위해 그대로 두고,
-- 새 글/수정 글은 이제부터 screenshot_urls를 같이 채웁니다(첫 장은
-- screenshot_url에도 계속 넣어줘서 혹시 옛 코드가 그 컬럼만 봐도 문제없게 해요).

alter table public.community_posts
  add column if not exists screenshot_urls text[] not null default '{}';

-- 이미 있던 글들의 기존 단일 스크린샷도 배열에 채워 넣어요(1장짜리로).
update public.community_posts
set screenshot_urls = array[screenshot_url]
where screenshot_url is not null
  and coalesce(array_length(screenshot_urls, 1), 0) = 0;
