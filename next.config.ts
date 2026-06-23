import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
  },
  async headers() {
    return [
      {
        // Allow GHL to embed /ghl/* routes in an iframe
        source: "/ghl/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://app.gohighlevel.com https://*.gohighlevel.com https://app.getpatronpro.com https://*.leadconnectorhq.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
