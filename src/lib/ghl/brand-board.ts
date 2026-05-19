import { ghlFetch } from "./client";

interface BrandBoard {
  id: string;
  name: string;
}

export async function updateBrandColors(
  locationId: string,
  primaryColor: string,
  secondaryColor: string,
  token: string
): Promise<void> {
  try {
    const res = await ghlFetch(
      `/brand-boards?locationId=${locationId}`,
      { method: "GET", token }
    );

    if (!res.ok) {
      console.error("[updateBrandColors] GET failed:", res.status);
      return;
    }

    const json = (await res.json()) as { brandBoards?: BrandBoard[] };
    const boards = json.brandBoards ?? [];

    if (boards.length === 0) {
      console.warn("[updateBrandColors] no brand boards found");
      return;
    }

    const board = boards[0];
    console.info("[updateBrandColors] board structure:", JSON.stringify(board));
    const patchRes = await ghlFetch(`/brand-boards/${board.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ primaryColor, secondaryColor }),
    });

    if (!patchRes.ok) {
      console.error("[updateBrandColors] PATCH failed:", patchRes.status);
    }
  } catch (err) {
    console.error("[updateBrandColors] error:", err);
  }
}
