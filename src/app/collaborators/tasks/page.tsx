import { CommercialManualReviewTasks } from "@/components/collaborators/CommercialManualReviewTasks";
import { getCommercialReviewTasks } from "@/lib/collaborators/queries";

export const dynamic = "force-dynamic";

export default async function CollaboratorTasksPage() {
  const tasks = await getCommercialReviewTasks();
  const openCount = tasks.filter((task) => task.status === "open").length;
  const reviewedCount = tasks.filter((task) => task.manualReviewed).length;

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">Review queue</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Commercial review tasks</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-[#526078]">
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{tasks.length} tasks</span>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{openCount} open</span>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1">{reviewedCount} reviewed</span>
        </div>
      </header>

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
