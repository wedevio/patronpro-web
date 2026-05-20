const BASE = "https://services.leadconnectorhq.com";

/**
 * Default permissions applied to every new sub-account user during onboarding.
 * Disabled: Ads Manager, Adwords Reporting, Content AI, Gokollab, WordPress, Bot Service.
 */
const DEFAULT_STAFF_PERMISSIONS: Record<string, boolean> = {
  adPublishingEnabled: false,
  adPublishingReadOnly: false,
  adwordsReportingEnabled: false,
  contentAiEnabled: false,
  gokollabEnabled: false,
  wordpressEnabled: false,
  botService: false,
};

interface GHLUser {
  id: string;
  permissions: Record<string, boolean>;
  roles?: {
    type: string;
    role: string;
    locationIds: string[];
  };
}

/**
 * Fetches all users for a location and applies DEFAULT_STAFF_PERMISSIONS
 * to each one via PUT /users/:userId.
 */
export async function applyDefaultStaffPermissions(
  locationId: string,
  companyId: string,
  token: string
): Promise<void> {
  // 1. Fetch users for this location
  const searchRes = await fetch(
    `${BASE}/users/search?companyId=${companyId}&locationId=${locationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
      },
    }
  );

  if (!searchRes.ok) {
    const text = await searchRes.text();
    console.error("[users] Failed to fetch users:", searchRes.status, text);
    return;
  }

  const { users } = (await searchRes.json()) as { users: GHLUser[] };

  if (!users?.length) return;

  // 2. Update each user's permissions
  await Promise.all(
    users.map(async (user) => {
      const updatedPermissions = {
        ...user.permissions,
        ...DEFAULT_STAFF_PERMISSIONS,
      };

      const res = await fetch(`${BASE}/users/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[users] Failed to update user ${user.id}:`, res.status, text);
      } else {
        console.log(`[users] Permissions updated for user ${user.id}`);
      }
    })
  );
}
