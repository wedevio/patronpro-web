import type { DocBlock, CalloutVariant } from "@/lib/docs/types";
import { Info, AlertTriangle, CheckCircle, Zap, Clock } from "lucide-react";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Callout config
// ─────────────────────────────────────────────────────────────────────────────
const CALLOUT_CONFIG: Record<
  CalloutVariant,
  { bg: string; border: string; text: string; icon: React.ElementType }
> = {
  info:    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800",   icon: Info },
  warning: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  icon: AlertTriangle },
  success: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  icon: CheckCircle },
  accent:  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", icon: Zap },
  pending: { bg: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-800",   icon: Clock },
};

// ─────────────────────────────────────────────────────────────────────────────
// Text line renderer (converts bullet prefixes and inline formatting)
// ─────────────────────────────────────────────────────────────────────────────
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g);

  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <u key={i}>{part.slice(2, -2)}</u>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function TextContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        const indent = line.length - trimmed.length;
        const isBullet = trimmed.startsWith("• ") || trimmed.startsWith("- ");
        const isNumbered = /^\d+\./.test(trimmed);
        const text = isBullet ? trimmed.slice(2) : trimmed;

        return (
          <p
            key={i}
            className={`text-slate-700 text-[14px] leading-relaxed ${
              indent > 0 ? "ml-4" : ""
            } ${isBullet ? "flex gap-2 items-start" : ""}`}
          >
            {isBullet && <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />}
            {isNumbered && !isBullet ? (
              <span>{renderInline(text)}</span>
            ) : isBullet ? (
              <span>{renderInline(text)}</span>
            ) : (
              <span>{trimmed ? renderInline(trimmed) : "\u00A0"}</span>
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single block renderer
// ─────────────────────────────────────────────────────────────────────────────
export default function BlockRenderer({ block }: { block: DocBlock }) {
  if (block.type === "heading") {
    const d = block.data as { level: 2 | 3; text: string };
    if (d.level === 2) {
      return (
        <h2
          id={`heading-${block.id}`}
          className="text-[20px] font-semibold mt-8 mb-3 pb-2 border-b border-slate-200"
          style={{ color: "#1E2C46" }}
        >
          {d.text}
        </h2>
      );
    }
    return (
      <h3
        id={`heading-${block.id}`}
        className="text-[16px] font-semibold mt-5 mb-2"
        style={{ color: "#1E2C46" }}
      >
        {d.text}
      </h3>
    );
  }

  if (block.type === "text") {
    const d = block.data as { content: string };
    return (
      <div className="my-2">
        <TextContent content={d.content} />
      </div>
    );
  }

  if (block.type === "image") {
    const d = block.data as { url: string; alt: string; caption?: string };
    return (
      <figure className="my-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.url} alt={d.alt} className="rounded-lg max-w-full border border-slate-200" />
        {d.caption && (
          <figcaption className="text-[12px] text-slate-500 mt-1 text-center">{d.caption}</figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "video") {
    const d = block.data as { url: string; caption?: string };
    return (
      <figure className="my-4">
        <video
          src={d.url}
          controls
          className="rounded-lg max-w-full w-full border border-slate-200"
          preload="metadata"
        />
        {d.caption && (
          <figcaption className="text-[12px] text-slate-500 mt-1 text-center">{d.caption}</figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "callout") {
    const d = block.data as { variant: CalloutVariant; title?: string; content: string };
    const cfg = CALLOUT_CONFIG[d.variant] ?? CALLOUT_CONFIG.info;
    const Icon = cfg.icon;
    return (
      <div className={`my-3 rounded-lg border p-4 ${cfg.bg} ${cfg.border}`}>
        <div className={`flex gap-2 items-start ${cfg.text}`}>
          <Icon size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            {d.title && <p className="font-semibold text-[13px] mb-1">{d.title}</p>}
            <div className="text-[13px] leading-relaxed">
              <TextContent content={d.content} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
