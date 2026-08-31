import type { NextConfig } from "next";

import { DEFAULT_CAL_URL } from "./src/lib/site";

// Derive per-host CSP directives from env vars so only the configured
// origins are allowed — no wildcards, no localhost baked into production.
//
// The Cal host falls back to the same default as src/lib/site.ts. If the two
// ever disagree the embed renders into a frame the CSP then blocks, which
// surfaces as a section that silently fails to paint — so they share one
// constant rather than being kept in sync by hand.
const calHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_CAL_URL || DEFAULT_CAL_URL).host;
  } catch {
    return "";
  }
})();

const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").origin;
  } catch {
    return "http://localhost:3001";
  }
})();

const calDirective = (base: string) => (calHost ? `${base} https://${calHost}` : base);

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      calDirective("script-src 'self' 'unsafe-inline' 'unsafe-eval'"),
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      calDirective("img-src 'self' data:"),
      `connect-src 'self' ${apiOrigin}`,
      calDirective("frame-src 'self'"),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
