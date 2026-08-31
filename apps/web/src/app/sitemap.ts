import type { MetadataRoute } from "next";

// Same canonical host as robots.ts. A one-page site needs exactly one entry —
// add one per route as you add pages.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devanddeliver.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
