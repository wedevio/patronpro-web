import { CommercialManualReviewTasks } from "@/components/collaborators/CommercialManualReviewTasks";
import { getCommercialReviewTaskSummary, getCommercialReviewTasks } from "@/lib/collaborators/queries";

export const dynamic = "force-dynamic";

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

export default async function CollaboratorTasksPage() {
  const [tasks, summary] = await Promise.all([getCommercialReviewTasks(), getCommercialReviewTaskSummary()]);
  const openCount = tasks.filter((task) => task.status === "open").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const progressItems = [
    {
      label: "Exact sources",
      value: summary.exactSourceOpen,
      detail: "Product or brand-deal URLs to inspect",
    },
    {
      label: "Profile gates",
      value: summary.profileGateBlocked,
      detail: "Auth, unavailable page, or ownership checks",
    },
    {
      label: "Cited media open",
      value: summary.citedMediaOpen,
      detail: "Exact media still waiting for review",
    },
    {
      label: "Cleared checks",
      value: summary.visibleDone,
      detail: "Manual rows closed with a verdict",
    },
    {
      label: "Source repair parked",
      value: summary.internalDeferred,
      detail: "No exact public URL for operator review",
    },
  ];

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">Review queue</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Commercial review tasks</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-[#526078]">
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{tasks.length} tasks</span>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{openCount} open</span>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{blockedCount} blocked</span>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{summary.visibleDone} cleared</span>
        </div>
      </header>

      <section className="rounded-xl border border-[#dfe5ee] bg-white shadow-sm">
        <div className="border-b border-[#edf1f6] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">All-lanes progress</p>
        </div>
        <div className="grid gap-px bg-[#edf1f6] md:grid-cols-5">
          {progressItems.map((item) => (
            <div key={item.label} className="bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#182235]">{item.value}</p>
              <p className="mt-1 text-sm leading-5 text-[#526078]">{item.detail}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 px-4 py-3 text-sm font-semibold text-[#526078]">
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{plural(summary.visibleTotal, "visible task")}</span>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{summary.landingOrBioOpen} landing/bio open</span>
          {summary.laneSummaries.map((lane) => (
            <span key={lane.lane} className="rounded-full bg-[#f8fafc] px-3 py-1">
              {lane.lane}: {lane.total} pending
            </span>
          ))}
        </div>
      </section>

      {tasks.length ? (
        <CommercialManualReviewTasks tasks={tasks} showCandidate />
      ) : (
        <section className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#526078]">No open commercial review tasks.</p>
        </section>
      )}
    </div>
  );
}
