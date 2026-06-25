import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isPanelLabMode } from "@/lib/lab/panel-lab";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetPath: string[] }> },
): Promise<Response> {
  if (!isPanelLabMode()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { assetPath } = await params;
  if (!assetPath?.length || assetPath.some((part) => part === ".." || part.includes("/") || part.includes("\\"))) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "lab-assets", ...assetPath);
  try {
    const buffer = await readFile(filePath);
    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
