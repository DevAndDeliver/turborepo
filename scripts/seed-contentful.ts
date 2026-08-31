#!/usr/bin/env npx tsx
/**
 * Creates Contentful content types and entries for the landing page.
 *
 * Required env vars (add to apps/web/.env.local or export before running):
 *   CONTENTFUL_SPACE_ID          — from Settings → API Keys
 *   CONTENTFUL_MANAGEMENT_TOKEN  — from Settings → API Keys → Content Management Tokens
 *
 * Usage:
 *   npx tsx scripts/seed-contentful.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Load env from apps/web/.env.local if not already set
// ---------------------------------------------------------------------------
try {
  const envPath = resolve(process.cwd(), "apps/web/.env.local");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local is optional — env vars may be set externally
}

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error(
    "Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN.\n" +
      "Add them to apps/web/.env.local or export before running.",
  );
  process.exit(1);
}

const BASE = `https://api.contentful.com/spaces/${SPACE_ID}/environments/master`;
const HEADERS = {
  Authorization: `Bearer ${MGMT_TOKEN}`,
  "Content-Type": "application/vnd.contentful.management.v1+json",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function cma<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...HEADERS, ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

async function contentTypeExists(id: string): Promise<boolean> {
  const res = await fetch(`${BASE}/content_types/${id}`, {
    headers: HEADERS,
  });
  return res.status === 200;
}

async function entryCountForType(contentTypeId: string): Promise<number> {
  const res = await fetch(`${BASE}/entries?content_type=${contentTypeId}&limit=1`, {
    headers: HEADERS,
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { total: number };
  return data.total;
}

function log(msg: string) {
  console.log(`  ${msg}`);
}

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------
const HERO_CT = {
  name: "Landing Hero",
  displayField: "headline",
  fields: [
    { id: "headline", name: "Headline", type: "Symbol", required: true },
    { id: "subline", name: "Subline", type: "Symbol", required: true },
    { id: "ctaLabel", name: "CTA Label", type: "Symbol", required: true },
  ],
};

const FEATURE_CT = {
  name: "Feature Item",
  displayField: "title",
  fields: [
    { id: "title", name: "Title", type: "Symbol", required: true },
    { id: "description", name: "Description", type: "Text", required: true },
    { id: "order", name: "Order", type: "Integer", required: true },
  ],
};

const ARTICLE_TEASER_CT = {
  name: "Article Teaser",
  displayField: "title",
  fields: [
    { id: "number", name: "Number", type: "Symbol", required: true },
    { id: "title", name: "Title", type: "Symbol", required: true },
    { id: "excerpt", name: "Excerpt", type: "Text", required: true },
    { id: "href", name: "URL", type: "Symbol", required: true },
    { id: "published", name: "Published", type: "Boolean", required: true },
    { id: "order", name: "Order", type: "Integer", required: true },
  ],
};

async function upsertContentType(id: string, def: typeof HERO_CT) {
  if (await contentTypeExists(id)) {
    log(`content type '${id}' already exists — skipping`);
    return;
  }

  const ct = await cma<{ sys: { version: number } }>("PUT", `/content_types/${id}`, def);
  log(`created content type '${id}'`);

  // Activate (publish) the content type
  await cma("PUT", `/content_types/${id}/published`, undefined, {
    "X-Contentful-Version": String(ct.sys.version),
  });
  log(`published content type '${id}'`);
}

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------
type EntryFields = Record<string, { "en-US": unknown }>;

// Article teasers are seeded incrementally: the series grows over time, so a
// re-run must add new entries without duplicating or overwriting existing ones.
async function existingArticleNumbers(): Promise<Set<string>> {
  const res = await fetch(`${BASE}/entries?content_type=articleTeaser&limit=100`, {
    headers: HEADERS,
  });
  if (!res.ok) return new Set();
  const data = (await res.json()) as {
    items: Array<{ fields?: { number?: Record<string, string> } }>;
  };
  return new Set(
    data.items.map((i) => i.fields?.number?.["en-US"]).filter((n): n is string => Boolean(n)),
  );
}

async function createAndPublishEntry(contentTypeId: string, fields: EntryFields, label: string) {
  const entry = await cma<{ sys: { id: string; version: number } }>(
    "POST",
    "/entries",
    { fields },
    { "X-Contentful-Content-Type": contentTypeId },
  );

  await cma("PUT", `/entries/${entry.sys.id}/published`, undefined, {
    "X-Contentful-Version": String(entry.sys.version),
  });

  log(`created + published entry: ${label}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nSeeding Contentful space: ${SPACE_ID}\n`);

  console.log("1. Content types");
  await upsertContentType("landingHero", HERO_CT);
  await upsertContentType("featureItem", FEATURE_CT);
  await upsertContentType("articleTeaser", ARTICLE_TEASER_CT);

  console.log("\n2. Hero entry");
  const heroCount = await entryCountForType("landingHero");
  if (heroCount > 0) {
    log("hero entry already exists — skipping");
  } else {
    await createAndPublishEntry(
      "landingHero",
      {
        headline: { "en-US": "We build things\nthat work." },
        subline: {
          "en-US":
            "Full-stack products built on TypeScript, NestJS, and Next.js. Open source tooling, production-grade architecture.",
        },
        ctaLabel: { "en-US": "Get notified" },
      },
      "landingHero",
    );
  }

  console.log("\n3. Feature entries");
  {
    // Keep in sync with DEFAULT_FEATURES in apps/web/src/lib/contentful.ts.
    const features = [
      {
        title: "Monorepo, wired up",
        description:
          "Turborepo and pnpm workspaces with shared @repo/types (Zod), @repo/ui and @repo/config. Incremental builds and env-aware caching, already configured.",
        order: 1,
      },
      {
        title: "API ready for input",
        description:
          "NestJS with validated DTOs, rate limiting at 10 req/60s, Resend for email, and Swagger everywhere except production.",
        order: 2,
      },
      {
        title: "Tested and deployable",
        description:
          "Vitest in every workspace, a Docker dev environment, CI, and deploy configs for Vercel, Railway and your own VPS.",
        order: 3,
      },
    ];

    const existing = await entryCountForType("featureItem");
    if (existing > 0) {
      log(`${existing} feature entries already exist — skipping`);
    } else {
      for (const f of features) {
        await createAndPublishEntry(
          "featureItem",
          {
            title: { "en-US": f.title },
            description: { "en-US": f.description },
            order: { "en-US": f.order },
          },
          `Feature ${f.order}`,
        );
      }
    }
  }

  console.log("\n4. Article teaser entries");
  {
    // Keep in sync with DEFAULT_ARTICLES in apps/web/src/lib/contentful.ts,
    // which renders when Contentful isn't configured.
    const articles = [
      {
        number: "01",
        title: "Turborepo setup — why monorepo, structure, shared packages",
        excerpt:
          "Why we chose a monorepo, how we structured it, and which tradeoffs we made on shared packages. All decisions explained.",
        href: "https://devanddeliver.com/blog",
        published: false,
        order: 1,
      },
      {
        number: "02",
        title: "Building a landing page with Next.js 16, Tailwind v4, and Framer Motion",
        excerpt:
          "A full design and build session: from brainstorming the visual language to shipping a production-quality page with shared UI components.",
        href: "https://devanddeliver.com/blog",
        published: false,
        order: 2,
      },
      {
        number: "03",
        title: "Wiring to Contentful — headless CMS for static content",
        excerpt:
          "How we connected the landing page to Contentful so non-developers can update copy without touching code.",
        href: "https://devanddeliver.com/blog",
        published: false,
        order: 3,
      },
      {
        number: "04",
        title: "Embedding a self-hosted Cal.diy calendar in the App Router",
        excerpt:
          "A real booking flow on the page without an npm SDK — the iframe embed, the CSP rules it needs, and the parts that get weird.",
        href: "https://devanddeliver.com/blog",
        published: false,
        order: 4,
      },
      {
        number: "05",
        title: "Deploying to Vercel and Railway",
        excerpt:
          "Putting both apps live — Vercel for Next.js, Railway for NestJS. Environment variables, CI, and the first real domain.",
        href: "https://devanddeliver.com/blog",
        published: false,
        order: 5,
      },
      {
        number: "06",
        title: "Moving the API to a free Oracle Cloud VPS",
        excerpt:
          "When the Railway credit ran out: the Arm capacity lottery, Caddy and PM2, and a GitHub Actions deploy that survives a reboot.",
        href: "https://devanddeliver.com/blog",
        published: false,
        order: 6,
      },
    ];

    const existing = await existingArticleNumbers();
    const missing = articles.filter((a) => !existing.has(a.number));

    if (missing.length === 0) {
      log(`all ${articles.length} article teasers already exist — skipping`);
    } else {
      log(`${existing.size} existing, creating ${missing.length} missing`);
      for (const article of missing) {
        await createAndPublishEntry(
          "articleTeaser",
          {
            number: { "en-US": article.number },
            title: { "en-US": article.title },
            excerpt: { "en-US": article.excerpt },
            href: { "en-US": article.href },
            published: { "en-US": article.published },
            order: { "en-US": article.order },
          },
          `Article ${article.number}`,
        );
      }
    }
  }

  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
