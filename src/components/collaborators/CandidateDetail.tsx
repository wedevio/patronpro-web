import type {
  ActionabilityAnswerProjection,
  CandidateTaskProjection,
  ClearanceRunProjection,
  CollaboratorProjection,
  ContactBookProjection,
  ContactRouteProjection,
  SocialProfileProjection,
  WebsiteProjection,
} from "@/lib/collaborators/types";
import { hasMeaningfulContent } from "@/lib/collaborators/projections";
import { GhlContactButton } from "./GhlContactButton";
import { EvidenceImageGrid, MediaEvidenceGallery, type GalleryEvidenceImage } from "./MediaEvidenceGallery";

function Section({ id, title, children, value }: { id?: string; title: string; children: React.ReactNode; value: unknown }) {
  if (!hasMeaningfulContent(value)) return null;
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24 rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
      <h2 id={headingId} className="text-lg font-semibold text-[#182235]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionNav({ items }: { items: Array<{ id: string; title: string; value: unknown }> }) {
  const visibleItems = items.filter((item) => hasMeaningfulContent(item.value));
  if (visibleItems.length < 2) return null;
  return (
    <nav aria-label="Candidate detail sections" className="sticky top-3 z-10 rounded-2xl border border-[#dfe5ee] bg-white/95 p-3 shadow-sm backdrop-blur">
      <div className="flex gap-2 overflow-x-auto">
        {visibleItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="whitespace-nowrap rounded-xl bg-[#f5f7fb] px-3 py-2 text-sm font-semibold text-[#42506a] outline-none hover:bg-[#e8eef7] hover:text-[#182235] focus-visible:ring-2 focus-visible:ring-[#f1a13c]"
          >
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  if (!hasMeaningfulContent(value)) return null;
  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-4">
      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">{label}</span>
      <strong className="mt-2 block text-2xl text-[#182235]">{value}</strong>
    </div>
  );
}

function bullets(items: string[]) {
  return (
    <ul className="grid gap-2 text-sm leading-6 text-[#42506a]">
      {items.map((item) => (
        <li key={item} className="rounded-xl bg-[#f8fafc] px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

const OUTREACH_CHANNEL_MATRIX = [
  {
    channel: "Email / SMS",
    status: "GHL-ready after contact sync",
    use: "Use from GHL only when the public email or phone is verified and the operator chooses to send.",
    requirement: "PatronPro location email/SMS channel, consent rules, and contact dedupe settings.",
    docs: [
      ["Conversations API", "https://marketplace.gohighlevel.com/docs/ghl/conversations/send-a-new-message/"],
      ["Conversations tab", "https://help.gohighlevel.com/support/solutions/articles/155000006610-getting-started-with-the-conversations-tab"],
    ],
  },
  {
    channel: "WhatsApp",
    status: "Conditional",
    use: "Use only when WhatsApp is configured for the PatronPro location and the contact route is eligible.",
    requirement: "WhatsApp Business/API or coexistence setup plus template/session and opt-in constraints.",
    docs: [["WhatsApp settings", "https://help.gohighlevel.com/support/solutions/articles/155000006911-whatsapp-settings"]],
  },
  {
    channel: "Facebook / Instagram DMs",
    status: "Inbound-window limited",
    use: "Store public profile URLs, then use GHL only after a compliant inbound message, comment trigger, or reply window exists.",
    requirement: "Connected Facebook page and Instagram account; Meta message-access and session rules still apply.",
    docs: [
      ["FB/IG Messenger setup", "https://help.gohighlevel.com/support/solutions/articles/155000005068-getting-started-setup-facebook-and-instagram-messenger"],
      ["Instagram messenger action", "https://help.gohighlevel.com/support/solutions/articles/155000004662-workflow-action-instagram-interactive-messenger"],
    ],
  },
  {
    channel: "TikTok DMs / comments",
    status: "Conditional",
    use: "Use GHL only for connected TikTok Messaging flows; public TikTok profile URLs alone are not cold-DM permission.",
    requirement: "TikTok Messaging integration in the sub-account and eligible DM/comment automation context.",
    docs: [
      ["Integrate TikTok Messaging", "https://help.gohighlevel.com/support/solutions/articles/155000006620-integrate-tiktok-messaging"],
      ["TikTok DMs/comment automations", "https://help.gohighlevel.com/support/solutions/articles/155000006703-tiktok-dms-comment-automations"],
    ],
  },
  {
    channel: "LinkedIn / YouTube / X",
    status: "Manual-only",
    use: "Keep as research touchpoints and source URLs. Do not imply GHL can message these platforms from the dashboard.",
    requirement: "Manual outreach or another approved channel outside this dashboard.",
    docs: [],
  },
] as const;

function OutreachChannelMatrix() {
  return (
    <div className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#182235]">GHL Outreach Channel Matrix</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#526078]">
            Creating a contact in PatronPro / GHL stores the route and research note only. It does not send SMS, email, WhatsApp, DMs, workflow messages, or comments.
          </p>
        </div>
        <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">No auto outreach</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-[#68758d]">
            <tr>
              <th className="border-b border-[#dfe5ee] pb-3">Channel</th>
              <th className="border-b border-[#dfe5ee] pb-3">Dashboard stance</th>
              <th className="border-b border-[#dfe5ee] pb-3">Use after contact sync</th>
              <th className="border-b border-[#dfe5ee] pb-3">Prerequisites</th>
              <th className="border-b border-[#dfe5ee] pb-3">Official docs</th>
            </tr>
          </thead>
          <tbody>
            {OUTREACH_CHANNEL_MATRIX.map((row) => (
              <tr key={row.channel} className="border-b border-[#edf1f6] align-top">
                <td className="py-3 font-semibold text-[#182235]">{row.channel}</td>
                <td className="py-3">
                  <span className="inline-flex rounded-full bg-[#f1f5f9] px-2 py-1 text-xs font-semibold text-[#526078]">{row.status}</span>
                </td>
                <td className="py-3 leading-6 text-[#42506a]">{row.use}</td>
                <td className="py-3 leading-6 text-[#42506a]">{row.requirement}</td>
                <td className="py-3">
                  {row.docs.length ? (
                    <div className="grid gap-1">
                      {row.docs.map(([label, url]) => (
                        <a key={url} className="text-[#1d5fa7] underline-offset-4 hover:underline" href={url} target="_blank" rel="noreferrer">
                          {label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#68758d]">No supported GHL channel in this workflow</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type SourceLink = {
  label: string;
  url: string;
};

function formatNumber(value?: number | null) {
  if (!value) return null;
  return new Intl.NumberFormat("en-US").format(value);
}

function socialMetric(profile: SocialProfileProjection) {
  const metrics = [
    formatNumber(profile.followers) ? `${formatNumber(profile.followers)} followers` : null,
    formatNumber(profile.subscribers) ? `${formatNumber(profile.subscribers)} subscribers` : null,
    formatNumber(profile.likes) ? `${formatNumber(profile.likes)} likes` : null,
  ].filter(Boolean);
  return profile.visibleMetric || metrics.join(" + ") || profile.status || "captured";
}

function SocialBioLinkEvidence({ profile }: { profile: SocialProfileProjection }) {
  if (!profile.bioLinks.length && !profile.bioLinkAudits.length) return <span className="text-[#68758d]">-</span>;
  return (
    <div className="grid gap-2">
      {profile.bioLinkAudits.map((audit, index) => {
        const link = audit.resolvedUrl ?? audit.rawUrl;
        const relationshipSignal = audit.relationshipSignal && audit.relationshipSignal !== "none" ? audit.relationshipSignal : null;
        return (
          <div key={`${link ?? profile.url}-${index}`} className={`rounded-xl p-3 ${audit.isAbsenceReceipt ? "bg-[#fff8ed]" : "bg-[#f8fafc]"}`}>
            <div className="flex flex-wrap items-center gap-2">
              {audit.destinationType ? <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#526078]">{humanizeKey(audit.destinationType)}</span> : null}
              {relationshipSignal ? <span className="rounded-full bg-[#fff7ea] px-2 py-1 text-xs font-semibold text-[#9b5200]">{humanizeKey(relationshipSignal)}</span> : null}
            </div>
            {audit.destinationTitle || audit.destinationOwner ? (
              <p className="mt-2 text-sm font-semibold text-[#182235]">
                {[audit.destinationTitle, audit.destinationOwner].filter(Boolean).join(" / ")}
              </p>
            ) : null}
            {audit.bioText ? (
              <p className="mt-1 text-xs leading-5 text-[#526078]">
                <span className="font-semibold text-[#30405c]">Visible bio:</span> {audit.bioText}
              </p>
            ) : null}
            {audit.analysisNote ? <p className="mt-1 text-xs leading-5 text-[#526078]">{audit.analysisNote}</p> : null}
            {link ? (
              <a className="mt-2 block break-all text-xs text-[#1d5fa7] underline-offset-4 hover:underline" href={link} target="_blank" rel="noreferrer">
                {link}
              </a>
            ) : null}
          </div>
        );
      })}
      {!profile.bioLinkAudits.length
        ? profile.bioLinks.map((link) => (
            <a key={link} className="break-all text-xs text-[#1d5fa7] underline-offset-4 hover:underline" href={link} target="_blank" rel="noreferrer">
              {link}
            </a>
          ))
        : null}
    </div>
  );
}

function scoreValue(score?: number | null) {
  if (score === null || score === undefined) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true" className="text-[#f1a13c]">&#9733;</span>
      {(score / 20).toFixed(1)}
    </span>
  );
}

function humanizeKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeText(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text || /\/mnt\/|\/home\/|cookie|token|signed_url|api[_-]?key|secret/i.test(text)) return null;
  return text;
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function safeUrl(value: unknown) {
  const text = safeText(value);
  return text && isUrl(text) ? text : null;
}

function linkTargetProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};
}

function websiteReviewLinks(websites: WebsiteProjection[]) {
  return websites.flatMap((website) => website.reviewLinks.filter(hasMeaningfulContent));
}

function mediaWithComments(media: CollaboratorProjection["media"]) {
  return media.filter((item) => item.comments);
}

function addSourceLink(links: SourceLink[], seen: Set<string>, label: string, value: unknown) {
  const url = safeUrl(value);
  if (!url || seen.has(url)) return;
  seen.add(url);
  links.push({ label, url });
}

function collectSourceLinks(candidate: CollaboratorProjection) {
  const links: SourceLink[] = [];
  const seen = new Set<string>();

  addSourceLink(links, seen, "Primary public URL", candidate.primaryUrl);
  for (const profile of candidate.socialProfiles) addSourceLink(links, seen, `${profile.platform} profile`, profile.url);
  for (const website of candidate.websites) addSourceLink(links, seen, "Website", website.url);
  for (const item of candidate.media) addSourceLink(links, seen, `${item.platform ?? "media"} evidence`, item.url);
  for (const answer of candidate.actionabilityAnswers) {
    for (const url of answer.sourceUrls) addSourceLink(links, seen, answer.shortLabel ?? answer.label, url);
  }
  for (const run of candidate.clearanceRuns) addSourceLink(links, seen, `${run.platform ?? "clearance"} receipt`, run.sourceUrl);
  for (const contact of candidate.contactBook) {
    addSourceLink(links, seen, `${contact.name} profile`, contact.primaryPublicUrl);
    for (const url of contact.sourceUrls) addSourceLink(links, seen, `${contact.name} source`, url);
    for (const route of contact.routes) addSourceLink(links, seen, `${contact.name} route`, route.sourceUrl);
  }
  for (const collaborator of candidate.externalCollaborators) {
    addSourceLink(links, seen, `${collaborator.candidateName} profile`, collaborator.primaryUrl);
    for (const url of collaborator.sourceUrls) addSourceLink(links, seen, `${collaborator.candidateName} source`, url);
  }

  return links;
}

function InlineValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    const items = value.map(safeText).filter(Boolean) as string[];
    if (!items.length) return null;
    return (
      <span className="space-x-2">
        {items.map((item) =>
          isUrl(item) ? (
            <a key={item} href={item} target="_blank" rel="noreferrer" className="break-all text-[#1d5fa7] underline-offset-4 hover:underline">
              {item}
            </a>
          ) : (
            <span key={item}>{item}</span>
          ),
        )}
      </span>
    );
  }
  const text = safeText(value);
  if (!text) return null;
  if (isUrl(text)) {
    return (
      <a href={text} target="_blank" rel="noreferrer" className="break-all text-[#1d5fa7] underline-offset-4 hover:underline">
        {text}
      </a>
    );
  }
  return <span>{text}</span>;
}

function KeyValueGrid({ value }: { value: unknown }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value).filter(([, entryValue]) => hasMeaningfulContent(entryValue));
  if (!entries.length) return null;
  return (
    <dl className="grid gap-3 text-sm text-[#42506a] md:grid-cols-2">
      {entries.map(([key, entryValue]) => (
        <div key={key} className="rounded-xl bg-[#f8fafc] p-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">{humanizeKey(key)}</dt>
          <dd className="mt-1 leading-6">
            <InlineValue value={entryValue} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ObjectEvidenceList({ title, items }: { title: string; items: unknown[] }) {
  const usefulItems = items.filter(hasMeaningfulContent);
  if (!usefulItems.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#182235]">{title}</h4>
      <div className="mt-2 grid gap-2">
        {usefulItems.map((item, index) => (
          <div key={index} className="rounded-xl bg-white p-3">
            <KeyValueGrid value={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WebsiteFoundLinks({ links }: { links: Record<string, string> }) {
  const entries = Object.entries(links).filter(([, url]) => isUrl(url));
  if (!entries.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#182235]">Website-found social links</h4>
      <div className="mt-2 overflow-x-auto rounded-xl border border-[#e4eaf2] bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#68758d]">
            <tr>
              <th className="px-3 py-2">Platform</th>
              <th className="px-3 py-2">URL found on website</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([platform, url]) => (
              <tr key={`${platform}-${url}`} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 font-semibold capitalize text-[#182235]">{platform}</td>
                <td className="px-3 py-2">
                  <a className="break-all text-[#1d5fa7] underline-offset-4 hover:underline" href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function websiteScreenshotImages(website: WebsiteProjection): GalleryEvidenceImage[] {
  return website.screenshots.map((screenshot) => ({
    ...screenshot.image,
    id: screenshot.id,
    label: screenshot.label,
    mediaTitle: website.url,
  }));
}

function WebsiteAnalysis({ websites }: { websites: WebsiteProjection[] }) {
  return (
    <div className="grid gap-4">
      {websites.map((website) => {
        const screenshots = websiteScreenshotImages(website);
        return (
          <article key={website.url} className="rounded-2xl border border-[#edf1f6] bg-[#f8fafc] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">Website review</p>
                <a href={website.url} className="mt-1 block break-all text-lg font-semibold text-[#1d5fa7] underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                  {website.url}
                </a>
              </div>
              {website.crawlStatus ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#526078]">{website.crawlStatus}</span> : null}
            </div>

            {website.summary ? <p className="mt-4 text-sm leading-6 text-[#42506a]">{website.summary}</p> : null}

            <dl className="mt-4 grid gap-2 text-sm text-[#42506a] md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Clarity", website.clarityGrade],
                ["Persuasion", website.persuasionGrade],
                ["Contactability", website.contactability],
                ["Commercial exchange", website.commercialExchangeStatus],
                ["Locations", website.locationsCount ? formatNumber(website.locationsCount) : null],
              ].map(([label, value]) =>
                value ? (
                  <div key={label} className="rounded-xl bg-white p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">{label}</dt>
                    <dd className="mt-1 font-semibold text-[#182235]">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <WebsiteFoundLinks links={website.socialLinks} />
              <ObjectEvidenceList title="Public contact routes found on website" items={website.contactRoutes} />
              <ObjectEvidenceList title="Review links" items={website.reviewLinks} />
              <ObjectEvidenceList title="Join / community links" items={website.joinLinks} />
            </div>

            {screenshots.length ? (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-[#182235]">Website screenshots</h4>
                <EvidenceImageGrid images={screenshots} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function WebsiteReviews({ websites }: { websites: WebsiteProjection[] }) {
  const websitesWithReviews = websites.filter((website) => hasMeaningfulContent(website.reviewLinks));
  if (!websitesWithReviews.length) return null;
  return (
    <div className="grid gap-4">
      {websitesWithReviews.map((website) => (
        <article key={`${website.url}-reviews`} className="rounded-2xl border border-[#edf1f6] bg-[#f8fafc] p-4">
          <a href={website.url} className="break-all text-sm font-semibold text-[#1d5fa7] underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
            {website.url}
          </a>
          <div className="mt-3">
            <ObjectEvidenceList title="Review links" items={website.reviewLinks} />
          </div>
        </article>
      ))}
    </div>
  );
}

function CommentSignals({ media }: { media: CollaboratorProjection["media"] }) {
  const items = mediaWithComments(media);
  if (!items.length) return null;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <article key={`${item.id}-comments`} className="rounded-2xl border border-[#edf1f6] bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">{item.platform ?? "media"} engagement</p>
          <h3 className="mt-2 text-base font-semibold text-[#182235]">{item.id}</h3>
          <p className="mt-2 text-sm text-[#42506a]">{formatNumber(item.comments)} comments captured</p>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm text-[#1d5fa7] underline-offset-4 hover:underline">
              {item.url}
            </a>
          ) : null}
          {item.riskSummary ? <p className="mt-3 text-sm leading-6 text-[#7c4a05]">{item.riskSummary}</p> : null}
        </article>
      ))}
    </div>
  );
}

function SourceIndex({ links, evidenceIds }: { links: SourceLink[]; evidenceIds: string[] }) {
  return (
    <div className="grid gap-4">
      {links.length ? (
        <div className="overflow-x-auto rounded-2xl border border-[#edf1f6]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#68758d]">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">URL</th>
              </tr>
            </thead>
            <tbody>
              {links.slice(0, 48).map((link) => (
                <tr key={link.url} className="border-t border-[#edf1f6]">
                  <td className="px-3 py-2 font-semibold text-[#182235]">{link.label}</td>
                  <td className="px-3 py-2">
                    <a href={link.url} target="_blank" rel="noreferrer" className="break-all text-[#1d5fa7] underline-offset-4 hover:underline">
                      {link.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {evidenceIds.length ? (
        <div>
          <h3 className="text-sm font-semibold text-[#182235]">Evidence IDs</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {evidenceIds.slice(0, 48).map((id) => (
              <span key={id} className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-semibold text-[#526078]">
                {id}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function routeHref(route: ContactRouteProjection) {
  const value = route.value ?? route.url;
  if (!value) return null;
  if (route.type === "email") return `mailto:${value.replace(/^mailto:/i, "")}`;
  if (route.type === "phone") return `tel:${value.replace(/[^\d+]/g, "")}`;
  if (/^https?:\/\//i.test(value)) return value;
  return null;
}

function routeDisplay(route: ContactRouteProjection) {
  return route.value ?? route.url ?? route.label ?? route.type ?? "contact route";
}

function routeCanSyncToGhl(route: ContactRouteProjection) {
  return (route.type === "email" || route.type === "phone") && route.isDirect;
}

function bestGhlRoute(contact: ContactBookProjection) {
  return (
    contact.routes.find((route) => route.type === "email" && route.isDirect) ??
    contact.routes.find((route) => route.type === "phone" && route.isDirect) ??
    contact.routes.find((route) => route.isPreferred && route.isBusinessRoute && route.isDirect) ??
    contact.routes.find((route) => route.isBusinessRoute && route.isDirect) ??
    contact.routes.find((route) => route.isDirect) ??
    contact.routes.find((route) => route.type === "contact_form") ??
    contact.routes.find((route) => route.type === "website") ??
    contact.routes.find((route) => route.type === "public_profile") ??
    contact.routes[0] ??
    null
  );
}

function contactBadges(contact: ContactBookProjection) {
  return [
    contact.isDecisionMaker ? "decision maker" : null,
    contact.isPrimaryContact ? "primary" : null,
    contact.isBusinessContact ? "business contact" : null,
    contact.isInfluencer ? "influencer" : null,
    contact.hasDirectRoute ? "direct route" : null,
  ].filter(Boolean) as string[];
}

function routeScopeBadge(route: ContactRouteProjection) {
  if (route.isDirect) return { label: "direct", className: "bg-[#eef4ff] text-[#1d5fa7]" };
  if (route.isBusinessRoute) return { label: "via organization", className: "bg-[#f1f5f9] text-[#526078]" };
  return { label: "context", className: "bg-[#f1f5f9] text-[#526078]" };
}

function contactHeader(contact: ContactBookProjection) {
  const title = contact.roleTitle ?? contact.label ?? "Contact";
  const subtitle = [contact.headline, contact.label, contact.relationshipType?.replace(/_/g, " ")]
    .find((value) => value && value !== title);
  return { title, subtitle: subtitle ?? "Role needs verification" };
}

function isExternalContact(contact: ContactBookProjection) {
  const relationship = `${contact.relationshipType ?? ""} ${contact.group ?? ""} ${contact.label ?? ""}`.toLowerCase();
  return (
    relationship.includes("external") ||
    relationship.includes("collaborator") ||
    relationship.includes("featured_creator") ||
    relationship.includes("partner") ||
    relationship.includes("sponsor")
  );
}

function ContactRouteList({ routes }: { routes: ContactRouteProjection[] }) {
  if (!routes.length) return <p className="text-sm text-[#68758d]">No reliable route captured yet.</p>;
  return (
    <div className="grid gap-2">
      {routes.map((route) => {
        const href = routeHref(route);
        const display = routeDisplay(route);
        const scope = routeScopeBadge(route);
        return (
          <div key={route.id} className="rounded-xl border border-[#e4eaf2] bg-white p-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold capitalize text-[#182235]">{route.label ?? route.type ?? "route"}</p>
                {href ? (
                  <a className="mt-1 block break-all text-[#1d5fa7] underline-offset-4 hover:underline" href={href} {...linkTargetProps(href)}>
                    {display}
                  </a>
                ) : (
                  <p className="mt-1 break-all text-[#42506a]">{display}</p>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-1 text-xs">
                {route.isPreferred ? <span className="rounded-full bg-[#fff3df] px-2 py-1 font-semibold text-[#9b5200]">preferred</span> : null}
                <span className={`rounded-full px-2 py-1 font-semibold ${scope.className}`}>{scope.label}</span>
                {route.isBusinessRoute ? <span className="rounded-full bg-[#e9f6ef] px-2 py-1 font-semibold text-[#1d6a3a]">business</span> : null}
                {route.verificationStatus ? <span className="rounded-full bg-[#f1f5f9] px-2 py-1 font-semibold text-[#526078]">{route.verificationStatus}</span> : null}
                {route.latestGhlSyncStatus ? <span className="rounded-full bg-[#eef4ff] px-2 py-1 font-semibold text-[#1d5fa7]">GHL {route.latestGhlSyncStatus}</span> : null}
              </div>
            </div>
            {route.sourceUrl && isUrl(route.sourceUrl) ? (
              <a className="mt-2 block break-all text-xs text-[#68758d] underline-offset-4 hover:underline" href={route.sourceUrl} target="_blank" rel="noreferrer">
                Source: {route.sourceUrl}
              </a>
            ) : route.sourceUrl ? (
              <p className="mt-2 text-xs text-[#68758d]">Source: {route.sourceUrl}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ContactBookList({ candidate, contacts }: { candidate: CollaboratorProjection; contacts: ContactBookProjection[] }) {
  if (contacts.length) {
    return (
      <div className="space-y-3">
        {contacts.map((contact) => {
          const route = bestGhlRoute(contact);
          const badges = contactBadges(contact);
          const header = contactHeader(contact);
          return (
            <details key={contact.personId} className="group rounded-2xl border border-[#dfe5ee] bg-[#f8fafc] p-4" open={contact.rank === 1}>
              <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">
                    {contact.rank ? `#${contact.rank} · ` : ""}
                    {header.title}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[#182235]">{contact.name}</h3>
                  <p className="mt-1 text-sm text-[#526078]">{header.subtitle}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#1E2C46] shadow-sm group-open:bg-[#fff3df] group-open:text-[#9b5200]">
                  {contact.routes.length} routes
                </span>
              </summary>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                <div className="space-y-4">
                  {badges.length ? (
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#42506a]">
                      {badges.map((badge) => (
                        <span key={badge} className="rounded-full bg-white px-2 py-1">
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {contact.biographySummary ? <p className="text-sm leading-6 text-[#42506a]">{contact.biographySummary}</p> : null}
                  {contact.relationshipEvidenceSummary ? (
                    <p className="rounded-xl bg-white p-3 text-sm leading-6 text-[#42506a]">
                      <strong className="text-[#182235]">Evidence:</strong> {contact.relationshipEvidenceSummary}
                    </p>
                  ) : null}
                  {contact.primaryPublicUrl && (isUrl(contact.primaryPublicUrl) || contact.primaryPublicUrl.startsWith("mailto:") || contact.primaryPublicUrl.startsWith("tel:")) ? (
                    <a className="block break-all text-sm font-semibold text-[#1d5fa7] underline-offset-4 hover:underline" href={contact.primaryPublicUrl} {...linkTargetProps(contact.primaryPublicUrl)}>
                      Public profile: {contact.primaryPublicUrl}
                    </a>
                  ) : contact.primaryPublicUrl ? (
                    <p className="break-all text-sm font-semibold text-[#526078]">Public profile: {contact.primaryPublicUrl}</p>
                  ) : null}
                  {contact.sourceUrls.length ? (
                    <div>
                      <h4 className="text-sm font-semibold text-[#182235]">Source links</h4>
                      <div className="mt-2 grid gap-1">
                        {contact.sourceUrls.map((url) => (
                          <a key={url} className="break-all text-sm text-[#1d5fa7] underline-offset-4 hover:underline" href={url} target="_blank" rel="noreferrer">
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <ContactRouteList routes={contact.routes} />
                  {route ? (
                    <div className="rounded-xl border border-[#dfe5ee] bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">
                        CRM action
                      </p>
                      <GhlContactButton
                        candidateId={candidate.id}
                        personId={contact.personId}
                        routeId={route.id}
                        latestStatus={contact.latestGhlSyncStatus}
                        allowWithoutDirectRoute={!routeCanSyncToGhl(route)}
                      />
                      <p className="mt-2 text-xs leading-5 text-[#68758d]">
                        Creates or updates the contact only. It does not send outreach.
                        {routeCanSyncToGhl(route) ? "" : " This route is preview-only unless another email or phone is captured for the contact."}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    );
  }

  return <p className="text-sm text-[#68758d]">No contact book entries captured yet.</p>;
}

function ContactBook({ candidate }: { candidate: CollaboratorProjection }) {
  const internalContacts = candidate.contactBook.filter((contact) => !isExternalContact(contact));
  if (internalContacts.length) {
    return <ContactBookList candidate={candidate} contacts={internalContacts} />;
  }

  if (!candidate.contacts.length) {
    return <p className="text-sm text-[#68758d]">No internal contact book entries captured yet.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {candidate.contacts.map((contact, index) => (
        <article key={`${contact.status ?? "contact"}-${index}`} className="rounded-2xl bg-[#f8fafc] p-4">
          {contact.status ? <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#68758d]">{contact.status}</p> : null}
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#182235]">Preferred contact</h3>
              <div className="mt-2">
                <KeyValueGrid value={contact.preferredBusinessContact} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#182235]">Company context</h3>
              <div className="mt-2">
                <KeyValueGrid value={contact.companyContext} />
              </div>
            </div>
            {Array.isArray(contact.people) && contact.people.length ? (
              <div>
                <h3 className="text-sm font-semibold text-[#182235]">People</h3>
                <div className="mt-2 grid gap-2">
                  {contact.people.map((person, personIndex) => (
                    <div key={personIndex} className="rounded-xl bg-white p-3">
                      <KeyValueGrid value={person} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function CandidateRoadmap({ candidate }: { candidate: CollaboratorProjection }) {
  return (
    <div className="grid gap-4">
      {candidate.nextAction ? (
        <article className="rounded-2xl border border-[#edf1f6] bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">Next action</p>
          <p className="mt-2 text-sm leading-6 text-[#42506a]">{candidate.nextAction}</p>
        </article>
      ) : null}

      {candidate.tasks.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {candidate.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : null}

      {candidate.missingFields.length ? (
        <article className="rounded-2xl border border-[#edf1f6] bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">Open evidence gaps</p>
          <div className="mt-3">{bullets(candidate.missingFields)}</div>
        </article>
      ) : null}
    </div>
  );
}

function TaskCard({ task }: { task: CandidateTaskProjection }) {
  const meta = [task.priority, task.status, task.followUpAt ? `follow-up ${task.followUpAt}` : null, task.crmSyncEligible ? "CRM eligible" : null].filter(Boolean);
  return (
    <article className="rounded-2xl border border-[#edf1f6] bg-[#f8fafc] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">{task.type ?? "task"}</p>
          <h3 className="mt-2 text-base font-semibold text-[#182235]">{task.label}</h3>
        </div>
        {task.completedAt ? <span className="rounded-full bg-[#e9f6ef] px-2 py-1 text-xs font-semibold text-[#1d6a3a]">done</span> : null}
      </div>
      {task.summary ? <p className="mt-3 text-sm leading-6 text-[#42506a]">{task.summary}</p> : null}
      {task.blockerReason ? <p className="mt-3 text-sm leading-6 text-[#7c4a05]">{task.blockerReason}</p> : null}
      {meta.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {meta.map((item) => (
            <span key={item} className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#526078]">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function actionabilityCardValue(answer: ActionabilityAnswerProjection) {
  return answer.value ?? answer.evidenceSummary ?? answer.status ?? null;
}

const HIDDEN_TOP_ACTIONABILITY_KEYS = new Set(["recommended_outreach_path", "missing_next_step"]);

function CollaborationCompatibilityCards({ answers }: { answers: ActionabilityAnswerProjection[] }) {
  const visibleAnswers = answers.filter((answer) => !HIDDEN_TOP_ACTIONABILITY_KEYS.has(answer.key));
  if (!visibleAnswers.length) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {visibleAnswers.map((answer) => (
        <article key={answer.key} className="rounded-2xl border border-[#dfe5ee] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">{answer.shortLabel ?? answer.label}</p>
            {answer.confidence ? <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-xs font-semibold text-[#526078]">{answer.confidence}</span> : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-[#42506a]">{actionabilityCardValue(answer)}</p>
          {answer.evidenceSummary && answer.evidenceSummary !== answer.value ? (
            <p className="mt-3 rounded-xl bg-[#f8fafc] p-3 text-xs leading-5 text-[#526078]">{answer.evidenceSummary}</p>
          ) : null}
          {answer.sourceUrls.length ? (
            <div className="mt-3 grid gap-1">
              {answer.sourceUrls.slice(0, 2).map((url) => (
                <a key={url} className="break-all text-xs text-[#1d5fa7] underline-offset-4 hover:underline" href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function cleanTextList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeText(item)).filter(Boolean) as string[];
}

function shortSignal(value: string) {
  return value.length > 360 ? `${value.slice(0, 357).trim()}...` : value;
}

function commercialProfileFromRuns(clearanceRuns: ClearanceRunProjection[]) {
  for (const run of clearanceRuns) {
    const payload = run.rawPublicPayload;
    const profile = payload?.commercial_profile;
    if (profile && typeof profile === "object" && !Array.isArray(profile)) {
      const candidate = profile as Record<string, unknown>;
      if (candidate.schema_version === "commercial_profile_v1") {
        return candidate;
      }
    }
  }
  return null;
}

function CommercialSignalsOffers({ clearanceRuns }: { clearanceRuns: ClearanceRunProjection[] }) {
  const profile = commercialProfileFromRuns(clearanceRuns);
  if (!profile) return null;
  const services = cleanTextList(profile.services_offered);
  const brandSignals = cleanTextList(profile.brand_deal_or_product_signals);
  const techMentions = cleanTextList(profile.crm_or_tech_mentions);
  const seminarSignals = cleanTextList(profile.seminar_or_class_signals);
  const tone = cleanTextList(profile.tone_style);
  const summary = safeText(profile.summary);
  const languageMix = safeText(profile.language_mix);
  const confidence = safeText(profile.confidence);
  return (
    <article className="mt-4 rounded-2xl border border-[#dfe5ee] bg-[#fffaf2] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a5b17]">Commercial Signals & Offers</p>
        {[languageMix, confidence].filter(Boolean).length ? (
          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#8a5b17]">
            {[languageMix, confidence].filter(Boolean).join(" / ")}
          </span>
        ) : null}
      </div>
      {summary ? <p className="mt-3 text-sm leading-6 text-[#42506a]">{summary}</p> : null}
      <div className="mt-5 grid gap-4">
        {services.length ? <SignalSection title="Services / offers" items={services} /> : null}
        {seminarSignals.length ? <SignalSection title="Seminars / classes" items={seminarSignals} /> : null}
        {techMentions.length ? <SignalSection title="CRM / tech mentions" items={techMentions} /> : null}
        {brandSignals.length ? <SignalSection title="Brand / product signals" items={brandSignals} /> : null}
        {tone.length ? <SignalSection title="Tone / style" items={tone} compact /> : null}
      </div>
    </article>
  );
}

function SignalSection({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <section className="rounded-2xl border border-[#f0dfbd] bg-white p-4">
      <h3 className="text-sm font-semibold text-[#8a5b17]">{title}</h3>
      <ul className={compact ? "mt-3 flex flex-wrap gap-2" : "mt-3 grid gap-2"}>
        {items.slice(0, 5).map((item) => (
          <li
            key={item}
            className={
              compact
                ? "rounded-full bg-[#fff7ea] px-3 py-1 text-sm font-medium text-[#42506a]"
                : "rounded-xl bg-[#fffaf2] px-3 py-2 text-sm leading-6 text-[#42506a]"
            }
          >
            {shortSignal(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClearanceSummary({ clearanceRuns }: { clearanceRuns: ClearanceRunProjection[] }) {
  if (!clearanceRuns.length) return null;
  return (
    <div className="mt-4 rounded-2xl border border-[#dfe5ee] bg-[#f8fafc] p-4">
      <h3 className="text-sm font-semibold text-[#182235]">Clearance receipts</h3>
      <div className="mt-3 grid gap-2">
        {clearanceRuns.slice(0, 6).map((run) => (
          <article key={run.id} className="rounded-xl bg-white p-3 text-sm leading-6 text-[#42506a]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#182235]">{run.platform ?? "clearance"}</span>
              {run.status ? <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#526078]">{run.status.replaceAll("_", " ")}</span> : null}
              <span>
                {formatNumber(run.itemsScanned) ?? "0"} reviewed · {formatNumber(run.keywordHits) ?? "0"} hits · {formatNumber(run.confirmedFindings) ?? "0"} confirmed conflicts
              </span>
            </div>
            {run.notes.length ? <p className="mt-2 text-xs leading-5 text-[#68758d]">{shortSignal(run.notes[0])}</p> : null}
            {run.sourceUrl ? (
              <a className="mt-2 block break-all text-xs text-[#1d5fa7] underline-offset-4 hover:underline" href={run.sourceUrl} target="_blank" rel="noreferrer">
                {run.sourceUrl}
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function ExternalCollaborators({ candidate }: { candidate: CollaboratorProjection }) {
  const externalContacts = candidate.contactBook.filter(isExternalContact);
  if (!candidate.externalCollaborators.length && !externalContacts.length) return null;
  return (
    <div className="space-y-4">
      {candidate.externalCollaborators.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {candidate.externalCollaborators.map((collaborator) => (
            <article key={collaborator.relationshipId} className="rounded-2xl bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">
                {collaborator.relationshipType?.replace(/_/g, " ") ?? "external collaborator"}
              </p>
              <a
                className="mt-2 block text-lg font-semibold text-[#1d5fa7] underline-offset-4 hover:underline"
                href={`/collaborators/${collaborator.candidateLane}/${collaborator.candidateId}`}
              >
                {collaborator.candidateName}
              </a>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#42506a]">
                {collaborator.confidence ? <span className="rounded-full bg-white px-2 py-1">{collaborator.confidence} confidence</span> : null}
                {formatNumber(collaborator.totalReach) ? <span className="rounded-full bg-white px-2 py-1">{formatNumber(collaborator.totalReach)} reach</span> : null}
                {scoreValue(collaborator.score) ? <span className="rounded-full bg-white px-2 py-1">{scoreValue(collaborator.score)}</span> : null}
              </div>
              {collaborator.evidenceSummary ? <p className="mt-3 text-sm leading-6 text-[#42506a]">{collaborator.evidenceSummary}</p> : null}
              {collaborator.primaryUrl ? (
                <a className="mt-3 block break-all text-sm text-[#1d5fa7] underline-offset-4 hover:underline" href={collaborator.primaryUrl} {...linkTargetProps(collaborator.primaryUrl)}>
                  {collaborator.primaryUrl}
                </a>
              ) : null}
              {collaborator.sourceUrls.length ? (
                <div className="mt-3 grid gap-1">
                  {collaborator.sourceUrls.map((url) => (
                    <a key={url} className="break-all text-xs text-[#68758d] underline-offset-4 hover:underline" href={url} target="_blank" rel="noreferrer">
                      Source: {url}
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {externalContacts.length ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#68758d]">People / creator collaborators</h3>
          <ContactBookList candidate={candidate} contacts={externalContacts} />
        </div>
      ) : null}
    </div>
  );
}

export function CandidateDetail({ candidate }: { candidate: CollaboratorProjection }) {
  const internalContactsValue = [candidate.contactBook.filter((contact) => !isExternalContact(contact)), candidate.contacts];
  const externalCollaboratorsValue = [candidate.externalCollaborators, candidate.contactBook.filter(isExternalContact)];
  const reviewsValue = websiteReviewLinks(candidate.websites);
  const commentsValue = mediaWithComments(candidate.media);
  const sourceLinks = collectSourceLinks(candidate);
  const sourceIndexValue = [sourceLinks, candidate.evidenceIds];
  const roadmapValue = [candidate.tasks, candidate.missingFields, candidate.nextAction];
  const sectionNavItems = [
    { id: "overview", title: "Overview", value: [candidate.overviewSummary, candidate.fitSummary, candidate.score, candidate.evidenceConfidence, candidate.totalReach] },
    { id: "collaboration-compatibility", title: "Fit answers", value: [candidate.actionabilityAnswers, candidate.clearanceRuns, candidate.socialProfiles] },
    { id: "internal-contacts", title: "Contact intelligence", value: internalContactsValue },
    { id: "recommendation", title: "Recommendation", value: candidate.recommendation },
    { id: "strategy", title: "Strategy", value: [candidate.opportunities, candidate.shortcomings, candidate.risks, OUTREACH_CHANNEL_MATRIX] },
    { id: "social-profiles", title: "Social inventory", value: candidate.socialProfiles },
    { id: "website-analysis", title: "Website", value: candidate.websites },
    { id: "review-links", title: "Reviews", value: reviewsValue },
    { id: "external-collaborators", title: "Collaborators", value: externalCollaboratorsValue },
    { id: "comments-engagement", title: "Comments", value: commentsValue },
    { id: "reviewed-media", title: "Media evidence", value: candidate.media },
    { id: "source-index", title: "Sources", value: sourceIndexValue },
    { id: "roadmap-strategy", title: "Roadmap", value: roadmapValue },
  ];
  return (
    <div className="space-y-5">
      <header id="overview" className="scroll-mt-24 rounded-3xl bg-[#1E2C46] p-6 text-white shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FCCC7B]">{candidate.lane}</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">{candidate.name}</h1>
        {candidate.overviewSummary ? <p className="mt-5 max-w-5xl text-base leading-7 text-[#d8e0ee] md:text-lg">{candidate.overviewSummary}</p> : null}
        {candidate.fitSummary ? (
          <div className="mt-5 max-w-5xl rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FCCC7B]">PatronPro fit</p>
            <p className="mt-2 text-sm leading-6 text-[#f2f6fb] md:text-base">{candidate.fitSummary}</p>
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Compatibility" value={scoreValue(candidate.score)} />
        <Metric label="Confidence" value={candidate.evidenceConfidence ?? null} />
        <Metric label="Reach" value={formatNumber(candidate.totalReach)} />
        <Metric label="Reviewed media" value={candidate.media.length || null} />
      </div>

      <SectionNav items={sectionNavItems} />

      <Section id="collaboration-compatibility" title="Fit Answers / Compatibility" value={[candidate.actionabilityAnswers, candidate.clearanceRuns, candidate.socialProfiles]}>
        <CollaborationCompatibilityCards answers={candidate.actionabilityAnswers} />
        <CommercialSignalsOffers clearanceRuns={candidate.clearanceRuns} />
        <ClearanceSummary clearanceRuns={candidate.clearanceRuns} />
      </Section>

      <Section id="internal-contacts" title="Contact Intelligence / Public Routes" value={internalContactsValue}>
        <ContactBook candidate={candidate} />
      </Section>

      <Section id="recommendation" title="Recommendation" value={candidate.recommendation}>
        <p className="text-base leading-7 text-[#42506a]">{candidate.recommendation}</p>
      </Section>

      <div id="strategy" className="scroll-mt-24 grid gap-5 lg:grid-cols-2">
        <Section title="Opportunities" value={candidate.opportunities}>
          {bullets(candidate.opportunities)}
        </Section>
        <Section title="Shortcomings / Caveats" value={[candidate.shortcomings, candidate.risks]}>
          {bullets([...candidate.shortcomings, ...candidate.risks])}
        </Section>
        <div className="lg:col-span-2">
          <OutreachChannelMatrix />
        </div>
      </div>

      <Section id="social-profiles" title="Verified Social Inventory" value={candidate.socialProfiles}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-[#68758d]">
              <tr>
                <th className="border-b border-[#dfe5ee] pb-3">Platform</th>
                <th className="border-b border-[#dfe5ee] pb-3">Profile</th>
                <th className="border-b border-[#dfe5ee] pb-3">Metric</th>
                <th className="border-b border-[#dfe5ee] pb-3">Bio / link-out</th>
                <th className="border-b border-[#dfe5ee] pb-3">Captured</th>
              </tr>
            </thead>
            <tbody>
              {candidate.socialProfiles.map((profile) => (
                <tr key={`${profile.platform}-${profile.url}`} className="border-b border-[#edf1f6]">
                  <td className="py-3 font-semibold capitalize">{profile.platform}</td>
                  <td className="py-3">
                    <a className="text-[#1d5fa7] underline-offset-4 hover:underline" href={profile.url} target="_blank" rel="noreferrer">
                      {profile.url}
                    </a>
                  </td>
                  <td className="py-3">
                    <div>{socialMetric(profile)}</div>
                    {profile.verificationStatus ? (
                      <span className="mt-1 inline-flex rounded-full bg-[#f1f5f9] px-2 py-1 text-xs font-semibold text-[#526078]">
                        {profile.verificationStatus}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3">
                    <SocialBioLinkEvidence profile={profile} />
                  </td>
                  <td className="py-3">{profile.capturedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="website-analysis" title="Website analysis" value={candidate.websites}>
        <WebsiteAnalysis websites={candidate.websites} />
      </Section>

      <Section id="review-links" title="Reviews / Ratings Sources" value={reviewsValue}>
        <WebsiteReviews websites={candidate.websites} />
      </Section>

      <Section id="external-collaborators" title="External collaborators" value={externalCollaboratorsValue}>
        <ExternalCollaborators candidate={candidate} />
      </Section>

      <Section id="comments-engagement" title="Comments / Engagement Signals" value={commentsValue}>
        <CommentSignals media={candidate.media} />
      </Section>

      <Section id="reviewed-media" title="Reviewed media evidence" value={candidate.media}>
        <MediaEvidenceGallery media={candidate.media} />
      </Section>

      <Section id="source-index" title="Source Index" value={sourceIndexValue}>
        <SourceIndex links={sourceLinks} evidenceIds={candidate.evidenceIds} />
      </Section>

      <Section id="roadmap-strategy" title="Roadmap / Next Steps" value={roadmapValue}>
        <CandidateRoadmap candidate={candidate} />
      </Section>
    </div>
  );
}
