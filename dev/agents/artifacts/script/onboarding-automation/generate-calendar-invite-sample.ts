#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { buildCalendarInvite, type CalendarInviteInput } from "../../../../../src/lib/onboarding/calendar-invite";

const OUT = "dev/agents/artifacts/doc/test/onboarding-automation/onboarding-calendar-invite-sample-2026-06-12.json";

const payload: CalendarInviteInput = {
  id: "demo-onboarding",
  title: "PatronPro Onboarding",
  start: "2026-06-15T10:00:00-06:00",
  end: "2026-06-15T11:00:00-06:00",
  timeZone: "America/Mexico_City",
  description: "Demo onboarding call for a non-live sample client.",
  location: "Google Meet",
  joinUrl: "https://meet.google.com/demo-demo-demo",
  organizerName: "PatronPro",
  organizerEmail: "support@example.com",
  attendeeName: "Demo Client",
  attendeeEmail: "client@example.com",
  createdAt: "2026-06-12T18:00:00Z",
};

const output = buildCalendarInvite(payload);
const artifact = {
  generatedAt: "2026-06-12T18:00:00.000Z",
  artifactRole: "onboarding-calendar-invite-sample",
  bead: "ppweb-0ka.2",
  payload,
  output: {
    fileName: output.fileName,
    links: output.links,
    providerNotes: output.providerNotes,
    icsDataUrlPrefix: "data:text/calendar;charset=utf-8;base64,",
    icsTextExcerpt: output.icsText.slice(0, 320),
    checksums: {
      icsTextSha256: createHash("sha256").update(output.icsText).digest("hex"),
    },
  },
  safety: {
    usesFakeDataOnly: true,
    containsSecrets: false,
    performedLiveProviderProbe: false,
    performedGhlMutation: false,
  },
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Wrote ${OUT}`);
