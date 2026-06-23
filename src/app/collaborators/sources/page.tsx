const sources = [
  ["Dashboard template research", "RLM web report on free modern Next.js + shadcn/ui dashboard templates, 2026-06-23."],
  ["Collaborator methodology", "RLM central collaborator profiling methodology and quality gates."],
  ["Postgres architecture", "PatronPro collaborator database target architecture decision, 2026-06-22."],
  ["Media evidence", "NAS-hosted videos, frames, contact sheets, transcripts, and sanitized Postgres projections."],
];

export default function SourcesPage() {
  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">Evidence base</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Sources and methodology</h1>
        <p className="mt-4 max-w-4xl text-[#526078]">
          This page will become the citation index for papers, web reports, RLM entries, repositories, and methodology notes used in the collaborator scoring workflow.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#526078]">{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
