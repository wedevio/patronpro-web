import Link from "next/link";

const navItems = [
  ["Overview", "/collaborators"],
  ["Schools", "/collaborators/schools"],
  ["Influencers", "/collaborators/influencers"],
  ["Communities", "/collaborators/communities"],
  ["Recommendations", "/collaborators/recommendations"],
  ["Roadmap", "/collaborators/roadmap"],
  ["Sources", "/collaborators/sources"],
];

export function CollaboratorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#182235]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 md:px-6 lg:flex-row lg:py-8">
        <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:w-72">
          <div className="rounded-2xl border border-[#dfe5ee] bg-white p-4 shadow-sm">
            <Link href="/collaborators" className="block rounded-xl bg-[#1E2C46] p-4 text-white">
              <span className="block text-xs uppercase tracking-[0.16em] text-[#FCCC7B]">PatronPro</span>
              <span className="mt-2 block text-xl font-semibold">Collaborator OS</span>
            </Link>
            <nav className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {navItems.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-[#33415c] hover:bg-[#f0f4fa] hover:text-[#1E2C46]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
