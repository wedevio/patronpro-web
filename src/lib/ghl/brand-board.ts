import { ghlFetch } from "./client";

interface BrandBoardColor {
  id: string;
  value: string;
  name?: string;
}

interface BrandBoard {
  id: string;
  name: string;
  colors?: BrandBoardColor[];
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
      console.error("[updateBrandColors] GET failed:", res.status, await res.text());
      return;
    }

    const json = (await res.json()) as { brandBoards?: BrandBoard[] };
    const boards = json.brandBoards ?? [];

    if (boards.length === 0) {
      console.warn("[updateBrandColors] no brand boards found");
      return;
    }

    const board = boards[0];
    console.info("[updateBrandColors] board:", JSON.stringify(board));

    // Build updated colors array: replace Main (grey) and Accent, keep the rest intact
    const existingColors: BrandBoardColor[] = board.colors ?? [];

    const updatedColors = existingColors.map((c) => {
      if (c.id === "grey") return { ...c, value: primaryColor };
      if (c.id === "new_color_607") return { ...c, value: secondaryColor };
      return c;
    });

    // If the color IDs weren't found, fall back to index-based update
    const hasGrey = existingColors.some((c) => c.id === "grey");
    const hasAccent = existingColors.some((c) => c.id === "new_color_607");

    const finalColors =
      hasGrey || hasAccent
        ? updatedColors
        : existingColors.map((c, i) => {
            if (i === 0) return { ...c, value: primaryColor };
            if (i === 1) return { ...c, value: secondaryColor };
            return c;
          });

    const patchRes = await ghlFetch(`/brand-boards/${board.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ colors: finalColors }),
    });

    if (!patchRes.ok) {
      const body = await patchRes.text();
      console.error("[updateBrandColors] PATCH failed:", patchRes.status, body);
    } else {
      console.info("[updateBrandColors] colors updated successfully");
    }
  } catch (err) {
    console.error("[updateBrandColors] error:", err);
  }
}
