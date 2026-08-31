import type { HeroContent, FeatureContent, ArticleTeaserContent } from "@repo/types";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const BASE_URL = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master`;

const REVALIDATE = 43200; // 12 hours

const DEFAULT_HERO: HeroContent = {
  headline: "We build things\nthat work.",
  subline:
    "Full-stack products built on TypeScript, NestJS, and Next.js. Open source tooling, production-grade architecture.",
  ctaLabel: "Get notified",
};

const DEFAULT_FEATURES: FeatureContent[] = [
  {
    order: 1,
    title: "Monorepo, wired up",
    description:
      "Turborepo and pnpm workspaces with shared @repo/types (Zod), @repo/ui and @repo/config. Incremental builds and env-aware caching, already configured.",
  },
  {
    order: 2,
    title: "API ready for input",
    description:
      "NestJS with validated DTOs, rate limiting at 10 req/60s, Resend for email, and Swagger everywhere except production.",
  },
  {
    order: 3,
    title: "Tested and deployable",
    description:
      "Vitest in every workspace, a Docker dev environment, CI, and deploy configs for Vercel, Railway and your own VPS.",
  },
];

const DEFAULT_ARTICLES: ArticleTeaserContent[] = [
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

async function fetchEntries<T>(contentType: string): Promise<T[]> {
  const res = await fetch(
    `${BASE_URL}/entries?content_type=${contentType}&access_token=${ACCESS_TOKEN}`,
    { next: { revalidate: REVALIDATE } },
  );
  if (!res.ok) throw new Error(`Contentful ${contentType}: ${res.status}`);
  const json = (await res.json()) as { items: Array<{ fields: T }> };
  return json.items.map((item) => item.fields);
}

export async function fetchHero(): Promise<HeroContent> {
  if (!SPACE_ID || !ACCESS_TOKEN) return DEFAULT_HERO;
  try {
    const entries = await fetchEntries<HeroContent>("landingHero");
    return entries[0] ?? DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export async function fetchFeatures(): Promise<FeatureContent[]> {
  if (!SPACE_ID || !ACCESS_TOKEN) return DEFAULT_FEATURES;
  try {
    const entries = await fetchEntries<FeatureContent>("featureItem");
    return entries.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_FEATURES;
  }
}

export async function fetchArticles(): Promise<ArticleTeaserContent[]> {
  if (!SPACE_ID || !ACCESS_TOKEN) return DEFAULT_ARTICLES;
  try {
    const entries = await fetchEntries<ArticleTeaserContent>("articleTeaser");
    return entries.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_ARTICLES;
  }
}
