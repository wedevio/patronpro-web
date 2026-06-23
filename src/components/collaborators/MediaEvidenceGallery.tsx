"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { EvidenceImageProjection, MediaEvidenceProjection } from "@/lib/collaborators/types";

type GalleryImage = EvidenceImageProjection & {
  id: string;
  label: string;
  mediaTitle: string;
};

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
  const previous = () => onChange((index - 1 + images.length) % images.length);
  const next = () => onChange((index + 1) % images.length);

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1220]/90 p-4 text-white" role="dialog" aria-modal="true">
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
        <div className="min-h-0 flex-1 overflow-auto rounded-2xl bg-black/30 p-3">
          <Image
            src={image.detailUrl}
            width={image.detailWidth ?? 1600}
            height={image.detailHeight ?? 1200}
            alt={`${image.label} for ${image.mediaTitle}`}
            unoptimized
            className="mx-auto max-h-none max-w-none rounded-xl"
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
      </div>
    </div>
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
