import type { NextConfig } from "next";

const isExport = process.env.NEXT_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  serverExternalPackages: isExport ? [] : ["@prisma/client", "@prisma/client/default"],
  output: isExport ? "export" : undefined,
  images: isExport ? { unoptimized: true } : undefined,
};

export default nextConfig;
