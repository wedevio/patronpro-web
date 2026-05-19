const GHL_MEDIA_URL =
  "https://services.leadconnectorhq.com/medias/upload-file";

export async function uploadMedia(
  locationId: string,
  file: File,
  token: string
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("locationId", locationId);
    formData.append("name", file.name);

    const res = await fetch(GHL_MEDIA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
      },
      body: formData,
    });

    if (!res.ok) {
      console.error("[uploadMedia] failed:", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as { url?: string; fileUrl?: string };
    return json.url ?? json.fileUrl ?? null;
  } catch (err) {
    console.error("[uploadMedia] error:", err);
    return null;
  }
}
