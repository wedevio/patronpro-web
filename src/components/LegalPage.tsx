import { SiteHeader, SiteFooter } from "./SiteLayout";

interface LegalPageProps {
  title: string;
  eyebrow: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalPage({ title, eyebrow, lastUpdated = "April 24, 2026", children }: LegalPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="bg-white min-h-screen">
        <div className="max-w-[780px] mx-auto px-5 py-16">
          {/* Eyebrow */}
          <span
            className="inline-flex items-center gap-[10px] px-[14px] py-[10px] rounded-full text-[13px] font-bold uppercase tracking-[0.02em] w-fit mb-4"
            style={{ background: "rgba(246,125,10,0.10)", color: "#1E2C46" }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#F67D0A" }} />
            {eyebrow}
          </span>

          {/* Title */}
          <h1 className="text-[38px] font-black leading-[1.05] tracking-[-0.03em] mb-3" style={{ color: "#1E2C46" }}>
            {title}
          </h1>
          <p className="text-[14px] mb-10" style={{ color: "#5f6f88" }}>
            Last updated: {lastUpdated}
          </p>

          {/* Content */}
          <div
            className="text-[16px] leading-[1.75]"
            style={{ color: "#3d4f68" }}
          >
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/* ─── Shared prose primitives for legal pages ─── */

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[22px] font-bold mt-10 mb-3" style={{ color: "#1E2C46" }}>{title}</h2>
      {children}
    </section>
  );
}

export function LegalSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold mt-6 mb-2" style={{ color: "#1E2C46" }}>{title}</h3>
      {children}
    </div>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="mb-4">{children}</p>;
}

export function LegalUl({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 text-[15px] mb-4" style={{ color: "#5f6f88" }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export function LegalEmail() {
  return (
    <a href="mailto:info@getpatronpro.com" style={{ color: "#F67D0A" }} className="font-semibold">
      info@getpatronpro.com
    </a>
  );
}

export function LegalContact() {
  return (
    <LegalP>
      La Reyna Enterprises · 10821 Cassina Avenue, South Gate, CA 90280, United States · Email:{" "}
      <LegalEmail />
    </LegalP>
  );
}
