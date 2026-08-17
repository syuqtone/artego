import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // image-rules.md: 10 MB max upload — leave headroom for multipart
      // form overhead.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
