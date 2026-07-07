const phases = [
  ["Foundation", "Finish evidence repair, normalize reach metrics, and keep the current static dashboard accurate while the Next.js site is validated."],
  ["Seminar offer", "Package business-systems seminars where PatronPro is demonstrated as the operating workflow, not pitched as a generic CRM slide deck."],
  ["Asset library", "Create tutorials, onboarding docs, API/workflow references, and short clips that collaborators can safely send to their audiences."],
  ["Partner campaigns", "Use tracking links, landing pages, follow-up automations, and clear partner terms before approaching larger schools or influencer channels."],
  ["Scale", "After the school lane is proven, expand influencer and community collaborations with evidence-backed scoring and brand-safety review."],
];

const inspirationExamples = [
  {
    name: "RD Mortgage Pro",
    niche: "Mortgage brokers",
    signal: "Public page says the CRM is built on and powered by GoHighLevel.",
    takeaway: "Sells qualified lead flow, done-for-you ads, branded CRM, follow-up, appointments, reports, fast launch, and ROI proof.",
  },
  {
    name: "Local Business Ranks Contractor CRM",
    niche: "Contractors",
    signal: "Public page says the contractor CRM and automations are powered by GoHighLevel.",
    takeaway: "Packages one login for leads, replies, estimates, scheduling, field updates, invoices, reviews, and contractor-specific playbooks.",
  },
  {
    name: "UpMotion Media Contractor Software",
    niche: "Contractors",
    signal: "Public page says the contractor software is powered by GoHighLevel.",
    takeaway: "Leads with a simple monthly price, AI receptionist, review automation, online booking, SMS, CRM, and email.",
  },
  {
    name: "My Service Robot",
    niche: "Field service",
    signal: "Third-party comparison describes it as built on HighLevel CRM.",
    takeaway: "Positions as a lighter service-business CRM against ServiceTitan-style heavy platforms.",
  },
  {
    name: "CRM Done Better",
    niche: "Local business",
    signal: "Public page says it is powered by HighLevel.",
    takeaway: "Sells proven infrastructure plus support, not just software access.",
  },
  {
    name: "MarketerM8",
    niche: "OBMs and clients",
    signal: "Public post says HighLevel is delivered through MarketerM8.",
    takeaway: "Frames the CRM as a supported operating system that makes the operator look strategic to clients.",
  },
];

const inspirationMethod = [
  "First confirm the base: public GoHighLevel, HighLevel, LeadConnector, app-domain, or white-label evidence.",
  "Then run the normal collaborator research pass: website, social proof, content, offer, CTA, pricing, and skip ledger.",
  "Score the advertising pattern separately: headline, niche promise, proof, demo path, pricing, urgency, and what PatronPro should copy or avoid.",
];

const inspirationSources = [
  ["HighLevel go-to-market model", "https://marketplace.gohighlevel.com/docs/oauth/AgencyVsSubAccount"],
  ["HighLevel SaaS Mode pricing", "https://www.gohighlevel.com/pricing"],
  ["RD Mortgage Pro", "https://www.rdmarketingsolutions.com/rd-mortgage-pro"],
  ["Local Business Ranks Contractor CRM", "https://localbusinessranks.com/contractor-crm/"],
  ["UpMotion Media Contractor Software", "https://upmotionmedia.com/software/"],
  ["My Service Robot comparison", "https://www.yacdaddy.com/oby-reviews/my-service-robot-vs-servicetitan/"],
  ["CRM Done Better", "https://crmdonebetter.com/features"],
  ["MarketerM8", "https://www.marketerm8.com/post/all-in-one-crm-for-obms-and-clients"],
] as const;

const linkedinStrategy = [
  {
    title: "Use now",
    body: "Verify public company pages, named owners, creators, instructors, partnership contacts, and current role titles. Save LinkedIn URLs as source evidence and GHL contact context.",
  },
  {
    title: "Manual first contact",
    body: "Use LinkedIn manually when the public profile is the best route. The dashboard can store the touchpoint, but it should not send LinkedIn messages or connection requests.",
  },
  {
    title: "Paid option later",
    body: "LinkedIn Lead Gen Forms and Marketing APIs fit a later paid campaign lane after the offer is proven. They are not a shortcut for scraping decision-makers.",
  },
  {
    title: "Vendor evaluation",
    body: "Unipile, Crispy, or similar LinkedIn inbox/search vendors require a separate risk review for cost, account safety, terms, and whether they rely on official APIs or session automation.",
  },
];

const linkedinBoundaries = [
  "Official LinkedIn API access is approval-based; default developer access is not a general people-search or messaging API.",
  "Sales Navigator can help Duncan research accounts manually, but current official SNAP access is not open to new partners.",
  "Do not claim PatronPro can scrape LinkedIn, export Sales Navigator searches, or message arbitrary profiles through the dashboard.",
  "If a LinkedIn URL is stored on a contact, treat it as evidence and context until a human operator chooses a compliant outreach route.",
];

const linkedinSources = [
  ["LinkedIn API access", "https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access"],
  ["LinkedIn API terms", "https://www.linkedin.com/legal/l/api-terms-of-use"],
  ["LinkedIn prohibited software", "https://www.linkedin.com/help/linkedin/answer/a1341387"],
  ["Sales Navigator API / SNAP", "https://learn.microsoft.com/en-us/linkedin/sales/"],
  ["LinkedIn Marketing APIs", "https://learn.microsoft.com/en-us/linkedin/marketing/?view=li-lms-2026-06"],
  ["Lead Sync API access", "https://learn.microsoft.com/en-us/linkedin/marketing/lead-sync/getting-access-leadsync?view=li-lms-2026-06"],
  ["Unipile LinkedIn option", "https://www.unipile.com/communication-api/messaging-api/linkedin-api/"],
  ["Crispy LinkedIn option", "https://crispy.sh/blog/linkedin-api-pricing-comparison"],
] as const;

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
      <section className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b5200]">Inspiration</p>
            <h2 className="mt-2 text-2xl font-semibold">GHL-based CRM advertising patterns</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[#526078]">
              Study other white-label CRMs as positioning examples. The first step is proving whether the software appears to be built on GoHighLevel, HighLevel, or LeadConnector.
            </p>
          </div>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">Research queue</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {inspirationExamples.map((item) => (
            <article key={item.name} className="rounded-2xl bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">{item.niche}</p>
              <h3 className="mt-2 text-sm font-semibold text-[#182235]">{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#526078]">{item.signal}</p>
              <p className="mt-2 text-sm leading-6 text-[#182235]">{item.takeaway}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl bg-[#fff7ea] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9b5200]">Pipeline addition</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#526078]">
              {inspirationMethod.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#68758d]">Sources</h3>
            <div className="mt-3 grid gap-2 text-sm">
              {inspirationSources.map(([label, url]) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="text-[#1d5fa7] underline-offset-4 hover:underline">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b5200]">Contact strategy</p>
            <h2 className="mt-2 text-2xl font-semibold">LinkedIn for collaborator outreach</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[#526078]">
              LinkedIn is useful for public role verification and relationship research. It is not an automated cold-outreach channel in this dashboard.
            </p>
          </div>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">Manual / evidence-led</span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {linkedinStrategy.map((item) => (
            <article key={item.title} className="rounded-2xl bg-[#f8fafc] p-4">
              <h3 className="text-sm font-semibold text-[#182235]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#526078]">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl bg-[#fff7ea] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9b5200]">Boundaries</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#526078]">
              {linkedinBoundaries.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#68758d]">Sources / decisions</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <span className="font-semibold text-[#182235]">RLM: LinkedIn Contact Intelligence Boundary (current)</span>
              {linkedinSources.map(([label, url]) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="text-[#1d5fa7] underline-offset-4 hover:underline">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
