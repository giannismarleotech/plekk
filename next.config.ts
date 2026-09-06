import type { NextConfig } from "next";

const STATIC = process.env.STATIC_SITE === "1";
const BASE_PATH = (process.env.STATIC_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(STATIC ? { output: "export" as const, trailingSlash: true, basePath: BASE_PATH || undefined, images: { unoptimized: true }, typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true } } : {}),
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  outputFileTracingIncludes: { "/*": ["./drizzle/**/*"] },
};

export default nextConfig;
