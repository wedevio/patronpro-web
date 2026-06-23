const phases = [
  ["Foundation", "Finish evidence repair, normalize reach metrics, and keep the current static dashboard accurate while the Next.js site is validated."],
  ["Seminar offer", "Package business-systems seminars where PatronPro is demonstrated as the operating workflow, not pitched as a generic CRM slide deck."],
  ["Asset library", "Create tutorials, onboarding docs, API/workflow references, and short clips that collaborators can safely send to their audiences."],
  ["Partner campaigns", "Use tracking links, landing pages, follow-up automations, and clear partner terms before approaching larger schools or influencer channels."],
  ["Scale", "After the school lane is proven, expand influencer and community collaborations with evidence-backed scoring and brand-safety review."],
];

export default function RoadmapPage() {
  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">Strategy</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Partnership roadmap</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {phases.map(([title, body], index) => (
          <article key={title} className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[#9b5200]">Phase {index + 1}</span>
            <h2 className="mt-2 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#526078]">{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
