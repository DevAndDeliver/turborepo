import type { MetadataRoute } from "next";

// Canonical production host. A deployment is typically reachable on both its
// platform-assigned URL (e.g. *.vercel.app) and its real domain; point
// crawlers at the real one by setting NEXT_PUBLIC_SITE_URL.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    host: SITE_URL,
  };
}
