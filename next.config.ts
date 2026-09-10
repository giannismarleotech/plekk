import type { NextConfig } from "next";

const STATIC = process.env.STATIC_SITE === "1";
const BASE_PATH = (process.env.STATIC_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(STATIC ? { output: "export" as const, trailingSlash: true, basePath: BASE_PATH || undefined, images: { unoptimized: true }, typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true } } : {}),
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  /**
   * De marketingsite staat als kant-en-klare HTML in public/ (nl, fr, en, de).
   * Deze regels sturen /nl/prijzen/ door naar public/nl/prijzen/index.html.
   * "afterFiles" betekent: alleen als er geen echt bestand op dat pad staat.
   */
  async rewrites() {
    return {
      beforeFiles: [{ source: "/beheer", destination: "/login" }],
      afterFiles: [
        { source: "/:lang(nl|fr|en|de)", destination: "/:lang/index.html" },
        { source: "/:lang(nl|fr|en|de)/:slug", destination: "/:lang/:slug/index.html" },
        { source: "/:lang(nl|fr|en|de)/:slug/:sub", destination: "/:lang/:slug/:sub/index.html" },
      ],
      fallback: [],
    };
  },
  outputFileTracingIncludes: { "/*": ["./drizzle/**/*"] },
};

export default nextConfig;
