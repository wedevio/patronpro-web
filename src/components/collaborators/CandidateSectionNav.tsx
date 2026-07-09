"use client";

import { useEffect, useRef, useState } from "react";

type SectionNavItem = {
  id: string;
  title: string;
};

function laneLabel(lane: string) {
  return lane.replace(/_/g, " ");
}

export function CandidateSectionNav({
  candidateName,
  lane,
  items,
  wrapOnMobile = false,
}: {
  candidateName: string;
  lane: string;
  items: SectionNavItem[];
  wrapOnMobile?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: "-12px 0px 0px 0px",
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (items.length < 2) return null;
  return (
    <>
      <div ref={sentinelRef} className="h-px" />
      <div
        className="sticky top-0 z-30 px-4 pb-5 pt-3 md:px-6"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-[calc(100%-50px)] bg-[#f5f7fb] transition-opacity duration-200 ${
            stuck ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-[calc(100%-50px)] h-[82px] bg-gradient-to-b from-[#f5f7fb] via-[#f5f7fb]/85 to-[#f5f7fb]/0 transition-opacity duration-200 ${
            stuck ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          aria-label="Candidate detail sections"
          className="relative mx-auto max-w-[1632px] overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white shadow-sm"
        >
          <a
            href="#overview"
            className={`relative block overflow-hidden bg-gradient-to-r from-[#1E2C46] via-[#273a5d] to-[#13223b] px-4 transition-[max-height,padding] duration-200 ${
              stuck ? "max-h-16 py-2" : "max-h-0 py-0"
            }`}
            aria-hidden={!stuck}
            tabIndex={stuck ? 0 : -1}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FCCC7B]">{laneLabel(lane)}</span>
            <span className="block truncate text-sm font-semibold leading-5 text-[#f8fafc]">{candidateName}</span>
          </a>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-[50px] z-10 h-5 bg-gradient-to-b from-[#13223b]/20 via-white/75 to-white/0 transition-opacity duration-200 ${
              stuck ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className={`flex gap-2 p-3 ${wrapOnMobile ? "flex-wrap overflow-visible" : "overflow-x-auto"}`}>
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="whitespace-nowrap rounded-xl bg-[#f5f7fb] px-3 py-2 text-sm font-semibold text-[#42506a] outline-none hover:bg-[#e8eef7] hover:text-[#182235] focus-visible:ring-2 focus-visible:ring-[#f1a13c]"
              >
                {item.title}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
