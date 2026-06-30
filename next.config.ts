import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma + the Neon driver out of the bundler; they run only in Node
  // server actions.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "ws"],
  experimental: {
    // Headroom for downscaled image uploads sent through server actions.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
