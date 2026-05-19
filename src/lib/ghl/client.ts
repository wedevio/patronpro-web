const GHL_BASE = "https://services.leadconnectorhq.com";

export async function ghlFetch(
  path: string,
  options: RequestInit & { token: string }
): Promise<Response> {
  const { token, headers, ...rest } = options;
  return fetch(`${GHL_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
