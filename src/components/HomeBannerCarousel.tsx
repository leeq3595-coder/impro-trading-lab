"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Slide = {
  key: string;
  tag: string;
  tagClass: string;
  title: ReactNode;
  desc: ReactNode;
  cta: string;
  ctaClass: string;
  cardClass: string;
  url: string;
  sideImage?: string;
  sideImageClass?: string;
};

const DEFAULT_SIDE_IMAGE_CLASS =
  "absolute right-4 top-4 w-24 rounded-lg shadow-lg shadow-black/40 sm:w-28";

const AUTOPLAY_MS = 4000;

export function HomeBannerCarousel({ urls }: { urls: Record<string, string> }) {
  const slides: Slide[] = [
    {
      key: "banner1_signup",
      tag: "⚡ VIP UNLOCK",
      tagClass: "bg-[rgba(56,189,248,0.15)] text-[#38bdf8]",
      title: (
        <>
          올림프트레이드 가입하고
          <br />
          VIP칼럼 &amp; 시그널 참여하기
        </>
      ),
      desc: (
        <>
          임쁘로 추천코드로 가입 후 관리자 확인되면
          <br />
          VIP시그널, 칼럼이 자동으로 열려요
        </>
      ),
      cta: "지금 가입하기 →",
      ctaClass: "bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-[#04101f]",
      cardClass:
        "from-[#0e1b33] to-[#132043] border-[rgba(96,150,255,0.25)]",
      url: urls.banner1_signup || "/signup",
    },
    {
      key: "banner2_prop",
      tag: "🔥 PROP TRADING",
      tagClass: "bg-[rgba(74,222,128,0.15)] text-[#4ade80]",
      title: <>남의 돈으로 내 시드 불리기</>,
      desc: (
        <>
          내 돈 = 소액 테스트 · 회사 돈 = 진짜 계좌
          <br />
          수익 80% = 내 몫
        </>
      ),
      cta: "자세한 사항 확인 →",
      ctaClass: "bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#04101f]",
      cardClass:
        "from-[#0e2318] to-[#123420] border-[rgba(74,222,128,0.25)]",
      url: urls.banner2_prop || "/signup",
      sideImage: "/prop-proof.png",
      sideImageClass:
        "absolute right-4 top-11 w-24 rounded-lg shadow-lg shadow-black/40 sm:w-28",
    },
    {
      key: "banner3_youtube",
      tag: "🔴 임프로 유튜브",
      tagClass: "bg-[rgba(248,113,113,0.15)] text-[#f87171]",
      title: <>월에 5만불씩 출금中</>,
      desc: (
        <>
          임프로 트레이딩 실전 매매 내역
          <br />
          유튜브에서 직접 확인해보세요
        </>
      ),
      cta: "내역 보러가기 →",
      ctaClass: "bg-gradient-to-r from-[#f87171] to-[#ef4444] text-white",
      cardClass:
        "from-[#2a1218] to-[#3a1620] border-[rgba(248,113,113,0.25)]",
      url: urls.banner3_youtube || "/",
      // 유튜브 썸네일은 가로로 긴 이미지라, 오른쪽 빈 공간에 세로 중앙 정렬로
      // 2번 배너보다 조금 더 크게 넣어서 왼쪽 텍스트와 균형을 맞췄어요.
      sideImage: "/youtube-thumb.png",
      sideImageClass:
        "absolute right-3 top-1/2 w-32 -translate-y-1/2 rounded-lg shadow-lg shadow-black/40 sm:w-40",
    },
  ];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(idx);
  }

  function goTo(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  // 자동 슬라이드 — 4.5초마다 다음 배너로. 사용자가 직접 넘기면(active 변경) 그 시점부터 다시 타이머 시작.
  useEffect(() => {
    if (hovering) return;
    const timer = setTimeout(() => {
      goTo((active + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, hovering, slides.length]);

  return (
    <div className="mb-4">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onTouchStart={() => setHovering(true)}
        onTouchEnd={() => setHovering(false)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s) => (
          <a
            key={s.key}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`relative block w-full shrink-0 snap-center overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${s.cardClass}`}
          >
            {s.sideImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.sideImage}
                alt=""
                className={s.sideImageClass || DEFAULT_SIDE_IMAGE_CLASS}
              />
            )}
            <div className={s.sideImage ? "max-w-[62%]" : ""}>
              <div
                className={`mb-2 inline-block rounded-full px-2 py-1 text-[11px] font-bold ${s.tagClass}`}
              >
                {s.tag}
              </div>
              <div className="mb-1 text-lg font-bold leading-snug text-white">
                {s.title}
              </div>
              <p className="mb-4 text-xs leading-relaxed text-[#93a0b8]">
                {s.desc}
              </p>
              <span
                className={`inline-block rounded-xl px-4 py-2 text-sm font-bold ${s.ctaClass}`}
              >
                {s.cta}
              </span>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`슬라이드 ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              active === i ? "w-4 bg-[#38bdf8]" : "w-1.5 bg-[rgba(255,255,255,0.2)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
