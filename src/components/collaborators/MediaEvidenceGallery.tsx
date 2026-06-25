"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EvidenceImageProjection, MediaEvidenceProjection } from "@/lib/collaborators/types";

type GalleryImage = EvidenceImageProjection & {
  id: string;
  label: string;
  mediaTitle: string;
};

export type GalleryEvidenceImage = GalleryImage;

function formatNumber(value?: number | null) {
  if (!value) return null;
  return new Intl.NumberFormat("en-US").format(value);
}

function collectImages(media: MediaEvidenceProjection[]): GalleryImage[] {
  return media.flatMap((item) => {
    const labelPrefix = item.slot ? `${item.slot}. ` : "";
    const title = `${labelPrefix}${item.id}`;
    const images: GalleryImage[] = [];
    if (item.contactSheet) {
      images.push({
        ...item.contactSheet,
        id: `${item.id}-contact-sheet`,
        label: "Contact sheet",
        mediaTitle: title,
      });
    }
    if (item.representativeScreenshot) {
      images.push({
        ...item.representativeScreenshot,
        id: `${item.id}-frame`,
        label: "Representative frame",
        mediaTitle: title,
      });
    }
    return images;
  });
}

function ImageThumb({
  image,
  index,
  onOpen,
}: {
  image: GalleryImage;
  index: number;
  onOpen: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="group/image overflow-hidden rounded-xl border border-[#dfe5ee] bg-[#f8fafc] text-left transition hover:border-[#f1a13c]"
    >
      <Image
        src={image.thumbUrl}
        width={image.thumbWidth ?? 720}
        height={image.thumbHeight ?? 480}
        alt={`${image.label} for ${image.mediaTitle}`}
        unoptimized
        className="h-48 w-full bg-[#eef2f7] object-cover transition duration-200 group-hover/image:scale-[1.02]"
      />
      <span className="block px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">
        {image.label}
      </span>
    </button>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onChange,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const image = images[index];
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    drag.current = null;
  };
  const previous = () => {
    resetView();
    onChange((index - 1 + images.length) % images.length);
  };
  const next = () => {
    resetView();
    onChange((index + 1) % images.length);
  };
  const changeZoom = (value: number) => {
    const nextZoom = Math.max(1, Math.min(5, value));
    if (nextZoom === 1) setPan({ x: 0, y: 0 });
    setZoom(nextZoom);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") previous();
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next();
      if (event.key === "+" || event.key === "=") changeZoom(zoom + 0.25);
      if (event.key === "-") changeZoom(zoom - 0.25);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1220]/90 p-4 text-white"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <div className="flex items-start justify-between gap-4 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FCCC7B]">{image.label}</p>
            <h3 className="mt-1 text-lg font-semibold">{image.mediaTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-black/30 p-3"
          onWheel={(event) => {
            if (zoom <= 1) return;
            event.preventDefault();
            setPan((current) => ({
              x: current.x - (event.shiftKey ? event.deltaY : event.deltaX),
              y: current.y - (event.shiftKey ? 0 : event.deltaY),
            }));
          }}
        >
          <Image
            src={image.detailUrl}
            width={image.detailWidth ?? 1600}
            height={image.detailHeight ?? 1200}
            alt={`${image.label} for ${image.mediaTitle}`}
            unoptimized
            className={`mx-auto max-h-none max-w-none rounded-xl ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
            style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`, transformOrigin: "center center" }}
            onClick={(event) => {
              event.stopPropagation();
              changeZoom(zoom + (event.shiftKey || event.altKey ? -0.5 : 0.5));
            }}
            onPointerDown={(event) => {
              if (zoom <= 1) return;
              drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y });
            }}
            onPointerUp={(event) => {
              drag.current = null;
              try {
                event.currentTarget.releasePointerCapture(event.pointerId);
              } catch {
                // Pointer capture may already be released by the browser.
              }
            }}
          />
        </div>
        {images.length > 1 ? (
          <div className="flex items-center justify-between gap-3 pt-3 text-sm">
            <button type="button" onClick={previous} className="rounded-full border border-white/25 px-4 py-2 font-semibold hover:bg-white/10">
              Previous
            </button>
            <span className="text-white/75">
              {index + 1} / {images.length}
            </span>
            <button type="button" onClick={next} className="rounded-full border border-white/25 px-4 py-2 font-semibold hover:bg-white/10">
              Next
            </button>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 text-sm">
          <button type="button" onClick={() => changeZoom(zoom - 0.25)} className="rounded-full border border-white/25 px-3 py-1 font-semibold hover:bg-white/10">
            −
          </button>
          <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">{zoom.toFixed(2)}x</span>
          <button type="button" onClick={() => changeZoom(zoom + 0.25)} className="rounded-full border border-white/25 px-3 py-1 font-semibold hover:bg-white/10">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export function EvidenceImageGrid({
  images,
  className = "grid gap-3 sm:grid-cols-2",
}: {
  images: GalleryEvidenceImage[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className={className}>
        {images.map((image, index) => (
          <ImageThumb key={image.id} image={image} index={index} onOpen={setOpenIndex} />
        ))}
      </div>
      {openIndex !== null && openIndex >= 0 ? (
        <Lightbox images={images} index={openIndex} onClose={() => setOpenIndex(null)} onChange={setOpenIndex} />
      ) : null}
    </>
  );
}

export function MediaEvidenceGallery({ media }: { media: MediaEvidenceProjection[] }) {
  const images = useMemo(() => collectImages(media), [media]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {media.slice(0, 12).map((item) => {
          const itemImages = [
            item.contactSheet
              ? {
                  ...item.contactSheet,
                  id: `${item.id}-contact-sheet`,
                  label: "Contact sheet",
                  mediaTitle: `${item.slot ? `${item.slot}. ` : ""}${item.id}`,
                }
              : null,
            item.representativeScreenshot
              ? {
                  ...item.representativeScreenshot,
                  id: `${item.id}-frame`,
                  label: "Representative frame",
                  mediaTitle: `${item.slot ? `${item.slot}. ` : ""}${item.id}`,
                }
              : null,
          ].filter(Boolean) as GalleryImage[];

          return (
            <article key={item.id} className="rounded-2xl border border-[#edf1f6] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">
                <span>{item.platform}</span>
                {item.comments ? <span>{formatNumber(item.comments)} comments</span> : null}
                {item.likes ? <span>{formatNumber(item.likes)} likes</span> : null}
                {item.saves ? <span>{formatNumber(item.saves)} saves</span> : null}
              </div>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-[#1d5fa7]">
                  Open source
                </a>
              ) : null}
              {itemImages.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {itemImages.map((image) => (
                    <ImageThumb key={image.id} image={image} index={images.findIndex((candidate) => candidate.id === image.id)} onOpen={setOpenIndex} />
                  ))}
                </div>
              ) : null}
              {item.hook ? <p className="mt-3 text-sm leading-6 text-[#42506a]"><strong>Hook:</strong> {item.hook}</p> : null}
              {item.seminarPotential ? <p className="mt-2 text-sm leading-6 text-[#42506a]"><strong>Seminar:</strong> {item.seminarPotential}</p> : null}
              {item.visualSummary ? <p className="mt-2 text-sm leading-6 text-[#42506a]"><strong>Visual:</strong> {item.visualSummary}</p> : null}
              {item.audioSummary ? <p className="mt-2 text-sm leading-6 text-[#42506a]"><strong>Audio:</strong> {item.audioSummary}</p> : null}
              {item.cta ? <p className="mt-2 text-sm leading-6 text-[#42506a]"><strong>CTA:</strong> {item.cta}</p> : null}
              {item.riskSummary ? <p className="mt-2 text-sm leading-6 text-[#7c4a05]"><strong>Risk:</strong> {item.riskSummary}</p> : null}
            </article>
          );
        })}
      </div>
      {openIndex !== null && openIndex >= 0 ? (
        <Lightbox images={images} index={openIndex} onClose={() => setOpenIndex(null)} onChange={setOpenIndex} />
      ) : null}
    </>
  );
}
