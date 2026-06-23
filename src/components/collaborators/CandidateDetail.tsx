import type { CollaboratorProjection } from "@/lib/collaborators/types";
import { hasMeaningfulContent } from "@/lib/collaborators/projections";
import { MediaEvidenceGallery } from "./MediaEvidenceGallery";

function Section({ title, children, value }: { title: string; children: React.ReactNode; value: unknown }) {
  if (!hasMeaningfulContent(value)) return null;
  return (
    <section className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#182235]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
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

export function CandidateDetail({ candidate }: { candidate: CollaboratorProjection }) {
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

      <Section title="Recommendation" value={candidate.recommendation}>
        <p className="text-base leading-7 text-[#42506a]">{candidate.recommendation}</p>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Opportunities" value={candidate.opportunities}>
          {bullets(candidate.opportunities)}
        </Section>
        <Section title="Shortcomings / Caveats" value={[candidate.shortcomings, candidate.risks]}>
          {bullets([...candidate.shortcomings, ...candidate.risks])}
        </Section>
      </div>

      <Section title="Verified social profiles" value={candidate.socialProfiles}>
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
                    {formatNumber(profile.followers) ? `${formatNumber(profile.followers)} followers` : null}
                    {formatNumber(profile.subscribers) ? `${formatNumber(profile.subscribers)} subscribers` : null}
                    {formatNumber(profile.likes) ? `${formatNumber(profile.likes)} likes` : null}
                  </td>
                  <td className="py-3">{profile.capturedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Website analysis" value={candidate.websites}>
        <div className="grid gap-3 md:grid-cols-2">
          {candidate.websites.map((website) => (
            <article key={website.url} className="rounded-2xl bg-[#f8fafc] p-4">
              <a href={website.url} className="font-semibold text-[#1d5fa7]" target="_blank" rel="noreferrer">
                {website.url}
              </a>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#42506a]">
                <div>Clarity: {website.clarityGrade ?? "n/a"}</div>
                <div>Persuasion: {website.persuasionGrade ?? "n/a"}</div>
                <div>Contact: {website.contactability ?? "n/a"}</div>
                <div>Commercial: {website.commercialExchangeStatus ?? "n/a"}</div>
              </dl>
              {website.summary ? <p className="mt-3 text-sm leading-6 text-[#526078]">{website.summary}</p> : null}
            </article>
          ))}
        </div>
      </Section>

      <Section title="Contact intelligence" value={candidate.contacts}>
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
      </Section>

      <Section title="Reviewed media evidence" value={candidate.media}>
        <MediaEvidenceGallery media={candidate.media} />
      </Section>

      <Section title="Evidence gaps" value={candidate.missingFields}>
        <p className="text-sm text-[#526078]">Next action: {candidate.nextAction ?? "review"}</p>
        <div className="mt-3">{bullets(candidate.missingFields)}</div>
      </Section>
    </div>
  );
}
