"use client";

import { useState } from "react";

/**
 * 썸네일 이미지 컴포넌트: 이미지 주소가 없거나 불러오기에 실패하면(깨진 링크 등)
 * 브라우저 기본 "깨진 이미지" 아이콘 대신 이모지 아이콘으로 대체해서 보여줘요.
 */
export function SafeThumb({
  src,
  alt = "",
  className,
  fallbackClassName,
  fallbackEmoji,
}: {
  src: string | null | undefined;
  alt?: string;
  className: string;
  fallbackClassName?: string;
  fallbackEmoji?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    // fallback이 없으면(fallbackEmoji 미지정) 그냥 아무것도 안 보여줘요.
    if (!fallbackEmoji) return null;
    return <span className={fallbackClassName}>{fallbackEmoji}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
