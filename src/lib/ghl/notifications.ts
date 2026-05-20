import { ghlFetch } from "./client";

export async function notifyOnboarder(
  locationId: string,
  contactId: string,
  summary: string,
  token: string
): Promise<void> {
  // Add an internal note to the contact — no extra scope needed
  const res = await ghlFetch(`/contacts/${contactId}/notes`, {
    method: "POST",
    token,
    body: JSON.stringify({
      locationId,
      body: summary,
      userId: "onboarding-bot",
    }),
  });

  if (!res.ok) {
    console.error("[notifyOnboarder] POST note failed:", res.status, await res.text());
  } else {
    console.info("[notifyOnboarder] note added to contact ok");
  }
}
