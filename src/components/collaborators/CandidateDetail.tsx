import type {
  ActionabilityAnswerProjection,
  ClearanceRunProjection,
  CollaboratorProjection,
  ContactBookProjection,
  ContactRouteProjection,
  SocialProfileProjection,
  WebsiteProjection,
} from "@/lib/collaborators/types";
import { hasMeaningfulContent } from "@/lib/collaborators/projections";
import { CommercialClearanceButton } from "./CommercialClearanceButton";
import { GhlContactButton } from "./GhlContactButton";
import { EvidenceImageGrid, MediaEvidenceGallery, type GalleryEvidenceImage } from "./MediaEvidenceGallery";

function Section({ id, title, children, value }: { id?: string; title: string; children: React.ReactNode; value: unknown }) {
  if (!hasMeaningfulContent(value)) return null;
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#182235]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionNav({ items }: { items: Array<{ id: string; title: string; value: unknown }> }) {
  const visibleItems = items.filter((item) => hasMeaningfulContent(item.value));
  if (visibleItems.length < 2) return null;
  return (
    <nav className="sticky top-3 z-10 rounded-2xl border border-[#dfe5ee] bg-white/95 p-3 shadow-sm backdrop-blur">
      <div className="flex gap-2 overflow-x-auto">
        {visibleItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="whitespace-nowrap rounded-xl bg-[#f5f7fb] px-3 py-2 text-sm font-semibold text-[#42506a] hover:bg-[#e8eef7] hover:text-[#182235]"
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

function linkTargetProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};
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
  return route.type === "email" || route.type === "phone";
}

function bestGhlRoute(contact: ContactBookProjection) {
  return contact.routes.find((route) => route.type === "email") ?? contact.routes.find((route) => route.type === "phone") ?? null;
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
          return (
            <details key={contact.personId} className="group rounded-2xl border border-[#dfe5ee] bg-[#f8fafc] p-4" open={contact.rank === 1}>
              <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">
                    {contact.rank ? `#${contact.rank} · ` : ""}
                    {contact.label ?? "Contact"}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[#182235]">{contact.name}</h3>
                  <p className="mt-1 text-sm text-[#526078]">{contact.roleTitle ?? contact.headline ?? contact.relationshipType ?? "Role needs verification"}</p>
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
                  {route && routeCanSyncToGhl(route) ? (
                    <div className="rounded-xl border border-[#dfe5ee] bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">
                        CRM action
                      </p>
                      <GhlContactButton
                        candidateId={candidate.id}
                        personId={contact.personId}
                        routeId={route.id}
                        latestStatus={contact.latestGhlSyncStatus}
                      />
                      <p className="mt-2 text-xs leading-5 text-[#68758d]">Creates or updates the contact only. It does not send outreach.</p>
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
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {services.length ? <MiniSignalList title="Services / offers" items={services} /> : null}
        {seminarSignals.length ? <MiniSignalList title="Seminars / classes" items={seminarSignals} /> : null}
        {techMentions.length ? <MiniSignalList title="CRM / tech mentions" items={techMentions} /> : null}
        {brandSignals.length ? <MiniSignalList title="Brand / product signals" items={brandSignals} /> : null}
        {tone.length ? <MiniSignalList title="Tone / style" items={tone} /> : null}
      </div>
    </article>
  );
}

function MiniSignalList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5b17]">{title}</h3>
      <ul className="mt-2 grid gap-1 text-xs leading-5 text-[#42506a]">
        {items.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ClearanceSummary({ clearanceRuns }: { clearanceRuns: ClearanceRunProjection[] }) {
  if (!clearanceRuns.length) return null;
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {clearanceRuns.slice(0, 4).map((run) => (
        <article key={run.id} className="rounded-2xl border border-[#dfe5ee] bg-[#f8fafc] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">{run.platform ?? "clearance"}</p>
            {run.status ? <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#526078]">{run.status}</span> : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-[#42506a]">
            {formatNumber(run.itemsScanned) ?? "0"} items reviewed; {formatNumber(run.keywordHits) ?? "0"} keyword hits; {formatNumber(run.confirmedFindings) ?? "0"} confirmed conflicts.
          </p>
          {run.notes.length ? <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#526078]">{run.notes[0]}</p> : null}
          {run.sourceUrl ? (
            <a className="mt-3 block break-all text-xs text-[#1d5fa7] underline-offset-4 hover:underline" href={run.sourceUrl} target="_blank" rel="noreferrer">
              {run.sourceUrl}
            </a>
          ) : null}
        </article>
      ))}
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
  const sectionNavItems = [
    { id: "collaboration-compatibility", title: "Compatibility", value: [candidate.actionabilityAnswers, candidate.clearanceRuns, candidate.socialProfiles] },
    { id: "internal-contacts", title: "Contacts", value: internalContactsValue },
    { id: "recommendation", title: "Recommendation", value: candidate.recommendation },
    { id: "opportunities", title: "Opportunities", value: [candidate.opportunities, candidate.shortcomings, candidate.risks] },
    { id: "social-profiles", title: "Social", value: candidate.socialProfiles },
    { id: "website-analysis", title: "Website", value: candidate.websites },
    { id: "external-collaborators", title: "Collaborators", value: externalCollaboratorsValue },
    { id: "reviewed-media", title: "Media", value: candidate.media },
    { id: "evidence-gaps", title: "Gaps", value: candidate.missingFields },
  ];
  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-[#1E2C46] p-6 text-white shadow-sm md:p-8">
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

      <Section id="collaboration-compatibility" title="Collaboration Compatibility" value={[candidate.actionabilityAnswers, candidate.clearanceRuns, candidate.socialProfiles]}>
        <CollaborationCompatibilityCards answers={candidate.actionabilityAnswers} />
        <CommercialSignalsOffers clearanceRuns={candidate.clearanceRuns} />
        <ClearanceSummary clearanceRuns={candidate.clearanceRuns} />
        <CommercialClearanceButton candidateId={candidate.id} profiles={candidate.socialProfiles} />
      </Section>

      <Section id="internal-contacts" title="Internal contacts / public routes" value={internalContactsValue}>
        <ContactBook candidate={candidate} />
      </Section>

      <Section id="recommendation" title="Recommendation" value={candidate.recommendation}>
        <p className="text-base leading-7 text-[#42506a]">{candidate.recommendation}</p>
      </Section>

      <div id="opportunities" className="scroll-mt-24 grid gap-5 lg:grid-cols-2">
        <Section title="Opportunities" value={candidate.opportunities}>
          {bullets(candidate.opportunities)}
        </Section>
        <Section title="Shortcomings / Caveats" value={[candidate.shortcomings, candidate.risks]}>
          {bullets([...candidate.shortcomings, ...candidate.risks])}
        </Section>
      </div>

      <Section id="social-profiles" title="Verified social profiles" value={candidate.socialProfiles}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-[#68758d]">
              <tr>
                <th className="border-b border-[#dfe5ee] pb-3">Platform</th>
                <th className="border-b border-[#dfe5ee] pb-3">Profile</th>
                <th className="border-b border-[#dfe5ee] pb-3">Metric</th>
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

      <Section id="external-collaborators" title="External collaborators" value={externalCollaboratorsValue}>
        <ExternalCollaborators candidate={candidate} />
      </Section>

      <Section id="reviewed-media" title="Reviewed media evidence" value={candidate.media}>
        <MediaEvidenceGallery media={candidate.media} />
      </Section>

      <Section id="evidence-gaps" title="Evidence gaps" value={candidate.missingFields}>
        <p className="text-sm text-[#526078]">Next action: {candidate.nextAction ?? "review"}</p>
        <div className="mt-3">{bullets(candidate.missingFields)}</div>
      </Section>
    </div>
  );
}
