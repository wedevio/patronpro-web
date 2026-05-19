import { ghlFetch } from "./client";

export async function notifyOnboarder(
  locationId: string,
  contactId: string,
  summary: string,
  token: string
): Promise<void> {
  try {
    const res = await ghlFetch("/conversations/messages/outbound", {
      method: "POST",
      token,
      body: JSON.stringify({
        locationId,
        contactId,
        type: "SMS",
        message: summary,
      }),
    });

    if (!res.ok) {
      console.error("[notifyOnboarder] failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[notifyOnboarder] error:", err);
  }
}
