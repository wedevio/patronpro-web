function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  ghlAgencyToken: requireEnv("GHL_MCP"),
  ghlLocationToken: process.env.GHL_LOCATION_PIT ?? requireEnv("GHL_MCP"),
};
