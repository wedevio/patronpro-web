import { NextResponse } from "next/server";
import { createHash, createDecipheriv } from "crypto";
import { getAgencyAccessToken } from "@/lib/ghl/oauth";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// AES decryption — replicates CryptoJS.AES.decrypt(encryptedData, passphrase)
// CryptoJS uses OpenSSL EVP_BytesToKey (MD5) to derive key+IV from the passphrase.
// Encrypted format: base64( "Salted__" + 8-byte-salt + ciphertext )
// ---------------------------------------------------------------------------

function evpBytesToKey(
  password: string,
  salt: Buffer
): { key: Buffer; iv: Buffer } {
  const keyLen = 32; // AES-256
  const ivLen = 16;
  const derived: Buffer[] = [];
  let derivedLen = 0;
  let prev = Buffer.alloc(0);

  while (derivedLen < keyLen + ivLen) {
    prev = createHash("md5")
      .update(Buffer.concat([prev, Buffer.from(password, "utf8"), salt]))
      .digest();
    derived.push(prev);
    derivedLen += prev.length;
  }

  const combined = Buffer.concat(derived);
  return {
    key: combined.subarray(0, keyLen),
    iv: combined.subarray(keyLen, keyLen + ivLen),
  };
}

function decryptAesCryptoJs(encryptedData: string, secret: string): string {
  const raw = Buffer.from(encryptedData, "base64");

  // Validate "Salted__" magic prefix (first 8 bytes)
  const magic = raw.subarray(0, 8).toString("ascii");
  if (magic !== "Salted__") {
    throw new Error("Unexpected encrypted data format — missing Salted__ prefix");
  }

  const salt = raw.subarray(8, 16);
  const ciphertext = raw.subarray(16);

  const { key, iv } = evpBytesToKey(secret, salt);
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

// ---------------------------------------------------------------------------
// GHL user data shape (partial — only what we need)
// ---------------------------------------------------------------------------

interface GhlUserData {
  userId?: string;
  email?: string;
  userName?: string;
  name?: string;
  activeLocation?: string;
  companyId?: string;
}

interface GhlContact {
  id: string;
  email?: string;
}

interface GhlContactsSearchResponse {
  contacts?: GhlContact[];
}

// ---------------------------------------------------------------------------
// POST /api/auth/ghl-user-context
// Body: { encryptedData: string; location_id: string }
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  let body: { encryptedData?: string; location_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { encryptedData, location_id } = body;

  if (!encryptedData || !location_id) {
    return NextResponse.json(
      { error: "Missing encryptedData or location_id" },
      { status: 400 }
    );
  }

  const secret = process.env.GHL_APP_SHARED_SECRET;
  if (!secret) {
    // Graceful degradation — env var not configured
    return NextResponse.json({ contact_id: null, email: null, userName: null });
  }

  // 1. Decrypt user data
  let userData: GhlUserData;
  try {
    const decrypted = decryptAesCryptoJs(encryptedData, secret);
    userData = JSON.parse(decrypted) as GhlUserData;
  } catch (err) {
    console.error("[ghl-user-context] Failed to decrypt user data", err);
    return NextResponse.json(
      { error: "Failed to decrypt user data" },
      { status: 400 }
    );
  }

  const email = userData.email;
  const userName = userData.userName ?? userData.name ?? null;

  if (!email) {
    return NextResponse.json({ contact_id: null, email: null, userName });
  }

  // 2. Search GHL Contacts by email in the location
  let contactId: string | null = null;
  try {
    const agencyToken = await getAgencyAccessToken();

    const searchUrl = new URL(
      "https://services.leadconnectorhq.com/contacts/search"
    );
    searchUrl.searchParams.set("locationId", location_id);
    searchUrl.searchParams.set("query", email);
    searchUrl.searchParams.set("limit", "1");

    const res = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${agencyToken}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = (await res.json()) as GhlContactsSearchResponse;
      const match = data.contacts?.find(
        (c) => c.email?.toLowerCase() === email.toLowerCase()
      );
      contactId = match?.id ?? null;
    } else {
      console.warn(
        "[ghl-user-context] GHL contacts search failed",
        res.status,
        await res.text()
      );
    }
  } catch (err) {
    console.error("[ghl-user-context] GHL contacts search error", err);
    // Non-fatal — return without contact_id
  }

  return NextResponse.json({
    contact_id: contactId,
    email,
    userName,
  });
}
