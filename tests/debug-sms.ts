import { getLocationAccessToken } from "../src/lib/ghl/oauth";

const GHL_BASE = "https://services.leadconnectorhq.com";
const PATRONPRO_LOCATION_ID = "hHLZC7FaTtUINPf3cbHd";
const GHL_VERSION = "2021-07-28";

async function main() {
  // Get PatronPro location token
  const token = await getLocationAccessToken(PATRONPRO_LOCATION_ID);
  console.log("✓ Got location token\n");

  // Search contacts by location name
  const contactRes = await fetch(
    `${GHL_BASE}/contacts/?locationId=${PATRONPRO_LOCATION_ID}&query=Next+Layer&limit=3`,
    { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
  );
  const contactJson = await contactRes.json() as Record<string, unknown>;
  const contacts = (contactJson.contacts as Record<string, unknown>[]) ?? [];
  console.log(`Contacts matching "Next Layer": ${contacts.length}`);
  if (!contacts.length) {
    console.log("No contact found — SMS 'Enviado' is a false positive (contact doesn't exist in PatronPro)");
    return;
  }

  const contact = contacts[0];
  const contactId = contact.id as string;
  const contactEmail = contact.email as string;
  console.log(`Contact: ${contact.name} | ${contactEmail} | id: ${contactId}`);

  // Search conversation
  const convRes = await fetch(
    `${GHL_BASE}/conversations/search?locationId=${PATRONPRO_LOCATION_ID}&contactId=${contactId}&limit=5`,
    { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
  );
  const convJson = await convRes.json() as Record<string, unknown>;
  const convs = (convJson.conversations as Record<string, unknown>[]) ?? [];
  console.log(`\nConversations found: ${convs.length}`);

  for (const conv of convs) {
    console.log(`  - type: ${conv.type}, lastMessageType: ${conv.lastMessageType}, lastMessageDirection: ${conv.lastMessageDirection}`);

    // Get messages in this conversation
    const msgRes = await fetch(
      `${GHL_BASE}/conversations/${conv.id}/messages?limit=5`,
      { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
    );
    const msgJson = await msgRes.json() as Record<string, unknown>;
    const msgs = (msgJson.messages as Record<string, unknown>[]) ?? [];
    console.log(`    Messages: ${msgs.length}`);
    for (const m of msgs) {
      console.log(`      type: ${m.type}, direction: ${m.direction}, body: ${String(m.body ?? "").slice(0, 60)}`);
    }
  }
}

main().catch(console.error);
