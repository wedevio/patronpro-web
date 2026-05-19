function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Lazy getters — evaluated at runtime (inside request handlers), not at build time
export const env = {
  get ghlAgencyToken() {
    return requireEnv("GHL_MCP");
  },
  get ghlLocationToken() {
    return process.env.GHL_LOCATION_PIT ?? requireEnv("GHL_MCP");
  },
};
