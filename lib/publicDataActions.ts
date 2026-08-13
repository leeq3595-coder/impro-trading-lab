"use server";

import { revalidateTag } from "next/cache";

// 관리자(또는 회원)가 칼럼/자료실/커뮤니티/링크/공지를 직접 쓰거나
// 수정했을 때, 캐시된 공개 데이터(src/lib/publicData.ts)를 그 자리에서
// 바로 갱신하기 위한 서버 액션이에요. 클라이언트 컴포넌트(관리자 화면들)는
// 전부 브라우저에서 직접 Supabase를 호출하기 때문에, unstable_cache가
// 만든 캐시는 이 액션을 통해서만 즉시 비울 수 있어요.
//
// 태그 이름은 src/lib/publicData.ts에 있는 각 unstable_cache 호출의
// tags 옵션과 정확히 같아야 해요.
export async function revalidatePublicData(tags: string[]) {
  // { expire: 0 } = 즉시 만료(관리자가 저장하자마자 최신 데이터로 갱신).
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
