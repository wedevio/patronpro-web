"use client";

import { useEffect, useRef, useState } from "react";

type SectionNavItem = {
  id: string;
  title: string;
};

export function CandidateSectionNav({
  candidateName,
  lane,
  items,
}: {
  candidateName: string;
  lane: string;
  items: SectionNavItem[];
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
      <nav
        aria-label="Candidate detail sections"
        className="sticky top-3 z-20 overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white/95 shadow-sm backdrop-blur"
      >
        <a
          href="#overview"
          className={`block overflow-hidden bg-gradient-to-r from-[#1E2C46] via-[#273a5d] to-[#13223b] px-4 transition-[max-height,padding] duration-200 ${
            stuck ? "max-h-16 py-2" : "max-h-0 py-0"
          }`}
          aria-hidden={!stuck}
          tabIndex={stuck ? 0 : -1}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FCCC7B]">{lane}</span>
          <span className="block truncate text-sm font-semibold leading-5 text-[#f8fafc]">{candidateName}</span>
        </a>
        <div className="flex gap-2 overflow-x-auto p-3">
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
    </>
  );
}
