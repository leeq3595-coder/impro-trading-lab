import type { NextConfig } from "next";

// ⭐ 카톡 미리보기가 계속 안 뜨던 진짜 원인이 여기 있었어요 ⭐
// Next.js 16은 기본적으로 메타데이터(og:title 등)를 "스트리밍"으로 나중에
// 붙여요 — 그래서 실제 브라우저(자바스크립트 실행)에서는 결국 잘 보이지만,
// 카카오톡처럼 자바스크립트를 안 돌리고 그냥 HTML만 긁어가는 "링크 미리보기
// 봇"은 메타데이터가 붙기 전의 화면만 보게 돼요. Next.js는 구글/트위터/
// 페이스북/슬랙 등 유명 봇 목록엔 예외를 둬서 그 애들한텐 메타데이터를 다
// 채운 뒤에 화면을 보내주는데, 카카오톡 봇은 그 기본 목록에 없어서 계속
// 빈 미리보기만 나왔던 거예요. 아래에 카카오톡(과 네이버/라인 등 다른 국내
// 메신저) 봇을 추가해서 걔네한테도 완성된 메타데이터를 보내주게 해요.
const nextConfig: NextConfig = {
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|kakaotalk-scrap|kakaostory|band|line\/|daumoa/i,
};

export default nextConfig;
