"use client";

import Image from "next/image";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { isManualMediaReviewTask, parseManualMediaReviewNotes } from "@/lib/collaborators/manual-media-review";
import type { CandidateTaskProjection, EvidenceImageProjection, MediaEvidenceProjection } from "@/lib/collaborators/types";

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function analysisParts(text?: string | null) {
  const normalized = (text ?? "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;

  if (normalized.length < 260) return [normalized];
  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((part) => part.trim())
    .filter(Boolean);
  return sentences.length > 1 ? sentences : [normalized];
}

function AnalysisBlock({
  label,
  text,
  tone = "default",
}: {
  label: string;
  text?: string | null;
  tone?: "default" | "risk";
}) {
  const parts = analysisParts(text);
  if (!parts.length) return null;
  const color = tone === "risk" ? "text-[#7c4a05]" : "text-[#42506a]";

  if (parts.length === 1) {
    return (
      <p className={`mt-2 text-sm leading-6 ${color}`}>
        <strong>{label}:</strong> {parts[0]}
      </p>
    );
  }

  return (
    <div className={`mt-3 text-sm leading-6 ${color}`}>
      <p className="font-semibold">{label}:</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {parts.map((part, index) => (
          <li key={`${label}-${index}`}>{part}</li>
        ))}
      </ul>
    </div>
  );
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
  const [imageVisible, setImageVisible] = useState(true);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const suppressClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeFrame = useRef<number | null>(null);

  const clampedPan = (candidate: { x: number; y: number }, targetZoom = zoom) => {
    if (targetZoom <= 1) return { x: 0, y: 0 };
    const stage = stageRef.current;
    const img = imageRef.current;
    if (!stage || !img) return candidate;
    const baseWidth = img.clientWidth;
    const baseHeight = img.clientHeight;
    if (!baseWidth || !baseHeight) return candidate;
    const maxX = Math.max(0, (baseWidth * targetZoom - stage.clientWidth) / 2);
    const maxY = Math.max(0, (baseHeight * targetZoom - stage.clientHeight) / 2);
    return {
      x: clamp(candidate.x, -maxX, maxX),
      y: clamp(candidate.y, -maxY, maxY),
    };
  };

  const maxZoomForImage = () => {
    const img = imageRef.current;
    if (!img?.clientWidth || !img.naturalWidth) return 8;
    const naturalWidthScale = img.naturalWidth / img.clientWidth;
    return Math.max(5, Math.min(24, Math.ceil(naturalWidthScale * 4) / 4));
  };

  const readableZoomForImage = () => {
    const img = imageRef.current;
    if (!img?.clientWidth || !img.naturalWidth) return 2;
    const naturalWidthScale = img.naturalWidth / img.clientWidth;
    return Math.max(2, Math.min(maxZoomForImage(), naturalWidthScale));
  };

  const zoomStep = () => (zoom >= 5 ? 1 : 0.5);

  const clearSuppressClickTimer = () => {
    if (suppressClickTimer.current) clearTimeout(suppressClickTimer.current);
    suppressClickTimer.current = null;
  };

  const markDragClickSuppressed = () => {
    clearSuppressClickTimer();
    suppressClick.current = true;
    suppressClickTimer.current = setTimeout(() => {
      suppressClick.current = false;
      suppressClickTimer.current = null;
    }, 180);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    drag.current = null;
  };
  const clearFade = () => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    if (fadeFrame.current) cancelAnimationFrame(fadeFrame.current);
    fadeTimer.current = null;
    fadeFrame.current = null;
  };
  const changeImage = (nextIndex: number) => {
    if (nextIndex === index) return;
    clearFade();
    setImageVisible(false);
    fadeTimer.current = setTimeout(() => {
      resetView();
      onChange(nextIndex);
      fadeFrame.current = requestAnimationFrame(() => setImageVisible(true));
      fadeTimer.current = null;
    }, 150);
  };
  const previous = () => {
    changeImage((index - 1 + images.length) % images.length);
  };
  const next = () => {
    changeImage((index + 1) % images.length);
  };
  const changeZoom = (value: number) => {
    const nextZoom = Math.max(1, Math.min(maxZoomForImage(), value));
    setZoom(nextZoom);
    setPan((current) => clampedPan(current, nextZoom));
  };

  const finishDrag = (event: PointerEvent<HTMLImageElement>) => {
    const activeDrag = drag.current;
    drag.current = null;
    if (activeDrag?.moved) markDragClickSuppressed();
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture may already be released by the browser.
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        previous();
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        next();
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(zoom <= 1 ? readableZoomForImage() : zoom + zoomStep());
      }
      if (event.key === "-") {
        event.preventDefault();
        changeZoom(zoom - zoomStep());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const documentElement = document.documentElement;
    const previousBody = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const previousOverscroll = documentElement.style.overscrollBehavior;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    return () => {
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.left = previousBody.left;
      body.style.right = previousBody.right;
      body.style.width = previousBody.width;
      body.style.overflow = previousBody.overflow;
      documentElement.style.overscrollBehavior = previousOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setPan((current) => clampedPan(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  useEffect(
    () => () => {
      clearFade();
      clearSuppressClickTimer();
    },
    [],
  );

  return (
    <div
      className="fixed inset-0 bg-[#0b1220]/90 p-4 text-white"
      style={{ zIndex: 2147483647, overscrollBehavior: "none" }}
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
          ref={stageRef}
          className="min-h-0 flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/30 p-3"
          style={{ overscrollBehavior: "contain", touchAction: zoom > 1 ? "none" : "manipulation" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          onWheel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (zoom <= 1) return;
            setPan((current) => ({
              ...clampedPan({
                x: current.x - (event.shiftKey ? event.deltaY : event.deltaX),
                y: current.y - (event.shiftKey ? 0 : event.deltaY),
              }),
            }));
          }}
        >
          <Image
            ref={imageRef}
            key={image.id}
            src={image.detailUrl}
            width={image.detailWidth ?? 1600}
            height={image.detailHeight ?? 1200}
            alt={`${image.label} for ${image.mediaTitle}`}
            unoptimized
            loading="eager"
            draggable={false}
            className={`h-auto w-auto max-h-full max-w-full select-none rounded-xl object-contain transition-opacity duration-150 ease-out ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
            style={{
              opacity: imageVisible ? 1 : 0,
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: "center center",
              touchAction: zoom > 1 ? "none" : "manipulation",
            }}
            onLoad={() => setPan((current) => clampedPan(current))}
            onDragStart={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              if (zoom <= 1) changeZoom(readableZoomForImage());
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              if (zoom <= 1 || event.button !== 0) return;
              event.preventDefault();
              drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y, moved: false };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const activeDrag = drag.current;
              if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
              event.preventDefault();
              const deltaX = event.clientX - activeDrag.x;
              const deltaY = event.clientY - activeDrag.y;
              if (Math.hypot(deltaX, deltaY) > 4) activeDrag.moved = true;
              setPan(clampedPan({ x: activeDrag.panX + deltaX, y: activeDrag.panY + deltaY }));
            }}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={() => {
              drag.current = null;
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
          <button type="button" onClick={() => changeZoom(zoom - zoomStep())} className="rounded-full border border-white/25 px-3 py-1 font-semibold hover:bg-white/10">
            −
          </button>
          <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">{zoom.toFixed(2)}x</span>
          <button type="button" onClick={() => changeZoom(zoom <= 1 ? readableZoomForImage() : zoom + zoomStep())} className="rounded-full border border-white/25 px-3 py-1 font-semibold hover:bg-white/10">
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

export function MediaEvidenceGallery({
  media,
  manualReviews = [],
}: {
  media: MediaEvidenceProjection[];
  manualReviews?: CandidateTaskProjection[];
}) {
  const images = useMemo(() => collectImages(media), [media]);
  const reviewedManualMedia = manualReviews.filter(isManualMediaReviewTask);
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
              <AnalysisBlock label="Hook" text={item.hook} />
              <AnalysisBlock label="Seminar" text={item.seminarPotential} />
              <AnalysisBlock label="Visual" text={item.visualSummary} />
              <AnalysisBlock label="Audio" text={item.audioSummary} />
              <AnalysisBlock label="CTA" text={item.cta} />
              <AnalysisBlock label="Risk" text={item.riskSummary} tone="risk" />
            </article>
          );
        })}
        {reviewedManualMedia.map((task) => {
          const review = parseManualMediaReviewNotes(task.manualReviewNotes, task.reviewUrl ?? "");
          const url = review.mediaUrl || task.reviewUrl;
          return (
            <article key={task.id} className="rounded-2xl border border-[#edf1f6] bg-[#fbfcfe] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">
                <span>Manual review</span>
                {task.manualReviewVerdict ? <span>{task.manualReviewVerdict.replaceAll("_", " ")}</span> : null}
                {review.commercialAlliance ? <span>Commercial alliance</span> : null}
                {review.crmMention ? <span>CRM/software mention</span> : null}
              </div>
              <h3 className="mt-2 text-sm font-semibold leading-5 text-[#182235]">{task.reviewTargetLabel ?? task.label}</h3>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-[#1d5fa7]">
                  Open reviewed source
                </a>
              ) : null}
              {review.screenshotUrls.length ? (
                <div className="mt-3 grid gap-1 text-sm">
                  {review.screenshotUrls.map((screenshotUrl) => (
                    <a key={screenshotUrl} href={screenshotUrl} target="_blank" rel="noreferrer" className="break-all text-[#1d5fa7] underline-offset-4 hover:underline">
                      Screenshot
                    </a>
                  ))}
                </div>
              ) : null}
              <AnalysisBlock label="Human analysis" text={review.analysis || task.manualReviewNotes} />
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
