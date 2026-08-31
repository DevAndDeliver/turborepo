# Changelog

What has been added to this starter, and why. Newest first.

---

## [unreleased] — pnpm, Vitest, Docker dev environment

Changed:

- Yarn Berry → pnpm. `.npmrc` sets `node-linker=hoisted` to preserve the flat `node_modules` layout NestJS's decorator metadata needs (previously Yarn's `nodeLinker: node-modules`); verified by booting `apps/api` under it
- Internal workspace deps (`@repo/types`, `@repo/ui`, `@repo/config`) now use the `workspace:*` protocol instead of a bare `*`
- `.github/workflows/ci.yml` and `railway.json` install and build with pnpm
- `apps/api/tsconfig.json` no longer excludes `*.spec.ts` from typecheck (the build still excludes them via `tsconfig.build.json`); `packages/ui` and `packages/types` gained the same build/typecheck split so test files type-check without landing in `dist/`
- `turbo.json` declares every `NEXT_PUBLIC_*` variable in the `build` task's `env`. These are inlined at build time, so without declaring them a changed value would hit a stale cache entry and serve the old one

Added:

- Vitest in every workspace (`pnpm test` / `pnpm turbo test`), with one example test per package: schema validation (`packages/types`), component rendering via Testing Library (`packages/ui`), Contentful fallback behaviour (`apps/web`), and a mocked service unit test (`apps/api`)
- `docker-compose.yml` + `apps/web/Dockerfile.dev` + `apps/api/Dockerfile.dev` — dev-mode containers with hot reload via bind mounts. Dev-only; there is no production Dockerfile

---

## Self-hosting the API on a VPS

Added:

- `deploy/` — a complete alternative to the managed-platform path: Oracle Cloud Always Free provisioning notes, Caddy as the TLS-terminating reverse proxy, PM2 for process supervision, and a two-layer firewall walkthrough (`deploy/README.md`)
- `deploy/oracle-capacity-retry.sh` — polls Oracle for Arm (`VM.Standard.A1.Flex`) capacity and claims the first free slot, with single-instance guarantees and transient-failure backoff. `deploy/oracle-capacity-retry.test.sh` stubs the OCI CLI and asserts that behaviour, no Oracle account required
- `deploy/redeploy-api.sh` + `.github/workflows/deploy-api.yml` — pull, rebuild and `pm2 reload` on the box, by hand or from Actions. `apps/api/.env` is written from repository secrets and variables, then `chmod 600`
- `apps/api/ecosystem.config.js` — PM2 process definition
- `apps/api/src/throttler-behind-proxy.guard.ts` — behind a reverse proxy every request's `req.ip` is `127.0.0.1`, so the default throttler keys the entire internet on one bucket. With `trust proxy` on, this guard keys on the real client IP
- `deploy/verify-security.sh` — post-deploy checks: headers, throttling and recovery, CORS, `robots.txt`
- `apps/web/src/app/robots.ts` — canonical host for crawlers, from `NEXT_PUBLIC_SITE_URL`

---

## Deployment: Vercel + Railway

Added:

- `railway.json` — Nixpacks builder running `turbo build --filter=@repo/api...` (which builds `@repo/types` first) and `node apps/api/dist/main` as the start command (the full path is required when Railway runs from the repo root)
- `@nestjs/throttler` — global rate limiting (10 req / 60s per IP) on all API routes
- `next.config.ts` — the `connect-src` CSP directive is derived from `NEXT_PUBLIC_API_URL` at build time, so localhost is never baked into production headers
- `apps/api/src/main.ts` — CORS locked to `ALLOWED_ORIGIN`
- Full environment variable reference in both `.env.example` files

---

## Cal embed + Contact section

Added:

- `apps/web/src/components/contact/Contact.tsx` — a `#contact` section with an email fallback and an inline Cal iframe
- `apps/web/src/components/hero/TerminalWindow.tsx` — animated terminal built with Framer Motion stagger
- Hero rebuilt as a 2-column layout: copy left, `TerminalWindow` right
- `@calcom/embed-react` — type-safe embed, App Router compatible
- CSP `frame-src` and `script-src` directives derived from `NEXT_PUBLIC_CAL_URL` — tight per-host, no wildcards. Unset, the embed is blocked rather than silently allowed
- `apps/web/src/components/articles/Articles.tsx` — a post-teaser section driven by Contentful, with `fetchArticles()` in `contentful.ts` and `ArticleTeaserContent` in `packages/types`
- `scripts/seed-contentful.ts` — idempotent Content Management API seeder that creates the content types and placeholder entries from the CLI (`pnpm seed:contentful`)
- ISR raised from 1h to 12h (`revalidate: 43200`) across all Contentful fetches
- `ScrollAnimations.tsx` — a `requestAnimationFrame` fix so `opacity: 0` is painted before the IntersectionObserver fires

---

## Contentful CMS integration

Added:

- `apps/web/src/lib/contentful.ts` — raw `fetch` against the Contentful Delivery API instead of the SDK (~200KB saved); `fetchHero()` and `fetchFeatures()` run in parallel via `Promise.all`
- `packages/types/src/contentful.ts` — `HeroContent` and `FeatureContent` shared types
- ISR revalidation as one constant shared across every fetch
- Graceful fallback to static defaults when the env vars are missing — the repo runs with no Contentful account at all
- `turbo.json` — `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN` added to the `build` task env, needed for SSG/ISR

---

## Landing page

Added:

- Full landing page: `Navbar`, `Hero`, `Features`, `TechStack`, `Articles`, `WaitlistForm`, `Footer`
- Tailwind CSS v4, dark mode only, JetBrains Mono via `next/font`
- `packages/ui` — `Button` and `Input` shared components
- `apps/api/src/waitlist/` — `POST /waitlist` and `GET /waitlist/count`, backed by Resend Audiences, no database required
- Security headers in `next.config.ts` — CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`

---

## Monorepo scaffold

Added:

- `apps/web` — Next.js 16 with the App Router, TypeScript, Tailwind CSS v4
- `apps/api` — NestJS 11 with class-validator, Swagger (non-production only), dotenv
- `packages/types` — shared Zod schemas and TypeScript types imported by both apps
- `packages/ui` — shared component library
- `packages/config` — shared `tsconfig.json` and ESLint config
- `turbo.json` — build pipeline with `env` declarations for correct cache invalidation
- GitHub Actions CI — typecheck, lint, test and build on every push
