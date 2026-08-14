// ⭐ 카톡 미리보기용 태그를 generateMetadata 대신 페이지 컴포넌트 안에서
// 직접 <title>/<meta> 태그로 렌더링해요. (원인 불명으로 generateMetadata가
// 이 배포 환경에서 실행이 안 되는 문제가 있어서 — 오래 디버깅했지만 결국
// generateMetadata/미들웨어(proxy) 둘 다 프로덕션에서 실행 자체가 안 되는
// 걸 로그로 확인했어요.) React 19는 컴포넌트 트리 어디서든 <title>,
// <meta> 태그를 렌더링하면 자동으로 <head>로 옮겨줘요.
//
// ⚠️ og:image:width / og:image:height는 일부러 안 넣어요 — 게시글마다
// 이미지 크기가 제각각(회원이 올린 스크린샷, 대표이미지, 없으면 256x256
// 로고)인데 여기 고정값(1200x630)을 박아두면, 실제 이미지 크기랑 안 맞는
// 게시글에서 카카오 스크래퍼가 이미지 검증에 실패해 카드 전체를 기본값으로
// 대체해버릴 수 있어요. width/height 없이 og:image만 줘도 대부분의
// 스크래퍼(카톡 포함)는 실제 이미지를 받아서 크기를 알아서 읽어요.
export function OgTags({
  title,
  description,
  image,
  url,
  type = "article",
}: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: "article" | "website";
}) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="임프로 트레이딩랩" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
