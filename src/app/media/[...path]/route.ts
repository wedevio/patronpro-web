import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_MEDIA_ROOT = "/opt/clients/patronpro-collab-media";
const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

function getMediaRoot() {
  return path.resolve(process.env.COLLABORATOR_MEDIA_ROOT ?? DEFAULT_MEDIA_ROOT);
}

function resolveMediaPath(parts: string[]) {
  const root = getMediaRoot();
  const resolved = path.resolve(root, ...parts);
  if (!resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  const filePath = resolveMediaPath(params.path ?? []);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  const extension = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return new NextResponse("Unsupported media type", { status: 415 });

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = await readFile(filePath);
  return new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
