-- =========================================================
-- 회원이 커뮤니티 글(수익인증 스크린샷/매매법 본문)에 이미지·동영상을
-- 올릴 수 있게 허용해요. 기존 정책은 관리자(is_admin())만 업로드 가능해서
-- 일반 회원이 올리면 "new row violates row-level security policy" 오류가 났어요.
-- media 버킷의 "community/" 폴더 하위에는 로그인한 회원 누구나 업로드할 수
-- 있게 허용하고, 그 외 폴더(columns/, landing/ 등)는 계속 관리자만 가능해요.
-- =========================================================
drop policy if exists "media_member_insert_community" on storage.objects;
create policy "media_member_insert_community" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'community'
  );
