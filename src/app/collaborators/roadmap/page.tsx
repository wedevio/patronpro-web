const phases = [
  ["Foundation", "Finish evidence repair, normalize reach metrics, and keep the current static dashboard accurate while the Next.js site is validated."],
  ["Seminar offer", "Package business-systems seminars where PatronPro is demonstrated as the operating workflow, not pitched as a generic CRM slide deck."],
  ["Asset library", "Create tutorials, onboarding docs, API/workflow references, and short clips that collaborators can safely send to their audiences."],
  ["Partner campaigns", "Use tracking links, landing pages, follow-up automations, and clear partner terms before approaching larger schools or influencer channels."],
  ["Scale", "After the school lane is proven, expand influencer and community collaborations with evidence-backed scoring and brand-safety review."],
];

const inspirationExamples = [
  {
    name: "Jobber",
    niche: "Home and commercial services",
    signal: "Client-requested benchmark with public website, YouTube, Instagram, TikTok, Facebook, LinkedIn, and third-party creator sponsorship signals.",
    takeaway: "Sells simple contractor operations first, then extends trust through summit, grant, creator, and education surfaces that make the CRM feel like a growth community.",
  },
  {
    name: "Housecall Pro",
    niche: "Home-service professionals",
    signal: "Top field-service benchmark with strong official YouTube, TikTok, Instagram, Facebook, LinkedIn, and community signals.",
    takeaway: "Uses practical technician and owner content, free-tool positioning, and short-video reach to make the product feel operational before the demo request.",
  },
  {
    name: "ServiceTitan",
    niche: "Trades and enterprise field service",
    signal: "Large industry benchmark with official social surfaces, conference/community proof, partner marketplace signals, and vertical-specific product packaging.",
    takeaway: "Leans on scale, authority, and education-led category leadership; useful for what PatronPro should adapt without copying enterprise weight.",
  },
  {
    name: "Thryv",
    niche: "Small-business CRM and marketing",
    signal: "Broad SMB benchmark with official social surfaces and AI lead-flow messaging across CRM, marketing, payments, scheduling, and reputation.",
    takeaway: "Packages CRM as the center of a broader marketing automation system, which is a useful contrast to narrower field-service-first providers.",
  },
  {
    name: "RD Mortgage Pro",
    niche: "Mortgage brokers",
    signal: "Validated website capture says the CRM is built on GoHighLevel.",
    takeaway: "Packages ads, landing pages, branded CRM, follow-up, appointments, reporting, fast setup, scarcity, demo, and ROI proof into one vertical lead-gen system.",
  },
  {
    name: "Lead2Client CRM",
    niche: "Insurance agents",
    signal: "Validated website capture says it is a GoHighLevel-powered platform for insurance agents.",
    takeaway: "Combines CRM, AI lead tools, done-for-you ad campaigns, web services, pricing from $97/mo, strategy call, and agency-scale positioning.",
  },
  {
    name: "UpMotion Contractor Software",
    niche: "Contractors",
    signal: "Validated website capture says the contractor software is powered by GoHighLevel.",
    takeaway: "Leads with a $97/mo AI receptionist and missed-lead rescue story, then expands into reviews, booking, SMS, CRM, email, and a strategy call.",
  },
  {
    name: "CRM Done Better",
    niche: "Coaches",
    signal: "Validated website capture says it is powered by HighLevel.",
    takeaway: "Positions against the blank HighLevel account by selling a prebuilt system, onboarding, support, templates, automation, and an ecosystem of add-on services.",
  },
  {
    name: "CareFunnels",
    niche: "Home care agencies",
    signal: "Validated comparison page says it is built on HighLevel for home care.",
    takeaway: "Uses a sharp tools-versus-system comparison, then sells client intake, caregiver recruiting, ATS, AI voice/chat, referral partner follow-up, and specialist support.",
  },
  {
    name: "MarketerM8",
    niche: "UK SMEs and OBMs",
    signal: "Validated website and article captures say MarketerM8 is powered by HighLevel.",
    takeaway: "Runs a seminar-style education funnel with discovery calls, demos, buy-now paths, OBM content, and recurring live HighLevel workshops.",
  },
  {
    name: "My Service Robot",
    niche: "Home services",
    signal: "Captured checkout plus third-party comparison describe a HighLevel-based service-business CRM.",
    takeaway: "Bundles a fully built CRM with hiring pipeline, lead follow-up, review/referral follow-up, training, private community, referral commissions, and done-for-you setup.",
  },
  {
    name: "Tradie Pulse CRM",
    niche: "Trades",
    signal: "Validated website capture says the CRM is powered by LeadConnector.",
    takeaway: "Keeps the trades bundle compact: conversations, scheduling, pipeline, invoices, forms, funnels, reviews, team access, Meta/Google Ads integrations, fast launch, and no lock-in.",
  },
];

const inspirationMethod = [
  "Candidate resolution: confirm public GoHighLevel, HighLevel, LeadConnector, app-domain, or white-label evidence before a provider is eligible.",
  "Website capture: save rendered text plus WebP screenshots for product, pricing, demo, comparison, workshop, and case-study pages when present.",
  "Offer analysis: score headline, vertical promise, proof, CTA, pricing, urgency, onboarding, support, seminars, ads, affiliate/referral, and what PatronPro should copy or avoid.",
  "Media follow-up: queue YouTube demos, workshops, founder/influencer videos, Meta/Google/YouTube ad claims, and affiliate portals as public-only evidence targets.",
];

const inspirationSources = [
  ["HighLevel go-to-market model", "https://marketplace.gohighlevel.com/docs/oauth/AgencyVsSubAccount"],
  ["HighLevel SaaS Mode pricing", "https://www.gohighlevel.com/pricing"],
  ["RD Mortgage Pro", "https://www.rdmarketingsolutions.com/rd-mortgage-pro"],
  ["Lead2Client CRM", "https://www.lead2clientcrm.com/"],
  ["UpMotion Media Contractor Software", "https://upmotionmedia.com/software/"],
  ["CRM Done Better", "https://crmdonebetter.com/features"],
  ["CareFunnels comparison", "https://www.carefunnels.com/highlevel-vs-carefunnels/"],
  ["MarketerM8", "https://www.marketerm8.com/post/all-in-one-crm-for-obms-and-clients"],
  ["My Service Robot comparison", "https://www.yacdaddy.com/oby-reviews/my-service-robot-vs-highlevel/"],
  ["Tradie Pulse CRM", "https://leads-connector.com/"],
] as const;

const crmLaneStatus = [
  {
    title: "Website evidence",
    body: "Provider pages are captured as rendered evidence with WebP review screenshots where browser capture is available. New benchmark records keep source URLs and open screenshot tasks separate from Git-heavy raw media.",
  },
  {
    title: "Benchmark examples",
    body: "The live lane now includes Jobber, Housecall Pro, ServiceTitan, and Thryv alongside the earlier GHL/HighLevel/LeadConnector provider examples.",
  },
  {
    title: "Social strategy queue",
    body: "Each new benchmark has public YouTube, Instagram, TikTok, Facebook, and LinkedIn profile records; Facebook count and ad-library checks remain open where unauthenticated pages blocked reliable counts.",
  },
  {
    title: "Live DB",
    body: "The live collaborator database now has 16 crm_providers rows, 20 new benchmark social profiles, 48 new research answers, and 4 CRM case-study scorecards.",
  },
];

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
            <h2 className="mt-2 text-2xl font-semibold">CRM provider intelligence lane</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[#526078]">
              Study how CRM providers package software, ads, workshops, AI, demos, onboarding, vertical offers, social distribution, influencers, and customer-acquisition funnels.
            </p>
          </div>
          <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">Live DB seeded</span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {crmLaneStatus.map((item) => (
            <article key={item.title} className="rounded-2xl bg-[#f8fafc] p-4">
              <h3 className="text-sm font-semibold text-[#182235]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#526078]">{item.body}</p>
            </article>
          ))}
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
