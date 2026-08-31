# Turborepo Starter

A production-ready monorepo starter by [Dev and Deliver](https://devanddeliver.com) — the stack we use on real client projects.

> Built with Claude Code and verified by hand. The full write-up of how it was built lives on the [Dev and Deliver blog](https://devanddeliver.com/blog).

**This is our actual site, running.** Clone it and you get a working Dev and Deliver landing page — logo, copy, calendar and all. It is meant to be read and adapted, not deployed as-is; see [Making it yours](#making-it-yours) for everything you need to replace before it becomes your site.

## Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS v4           |
| Backend  | NestJS 11, class-validator, Swagger             |
| Security | Rate limiting (throttler), Helmet headers, CORS |
| Shared   | TypeScript 5.9, Zod schemas                     |
| Monorepo | Turborepo 2.9, pnpm workspaces                  |
| Testing  | Vitest                                          |
| CI       | GitHub Actions                                  |

## What's inside

```
apps/
  web/          Next.js app (landing page, frontend)
  api/          NestJS app (REST API, business logic)
packages/
  types/        Shared Zod schemas and TypeScript types
  ui/           Shared React components (Button, Input)
  config/       Shared tsconfig and ESLint configs
prettier.config.js  Prettier config, at the repo root — unlike ESLint and tsconfig,
                    it isn't run per-workspace via turbo, so it doesn't need to be
                    an importable package
```

The value of this structure: `packages/types` is imported by **both** `apps/web` and `apps/api`. You define `WaitlistEntry` once. The NestJS controller validates it. The Next.js form uses it. No drift.

## Getting started

```bash
# Clone
git clone https://github.com/devanddeliver/turborepo-starter.git
cd turborepo-starter

# Install (Corepack picks up the pnpm version pinned in package.json)
corepack enable
pnpm install

# Set up env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Run both apps
pnpm dev
```

- `apps/web` runs on [http://localhost:3000](http://localhost:3000)
- `apps/api` runs on [http://localhost:3001](http://localhost:3001)
- Swagger docs at [http://localhost:3001/docs](http://localhost:3001/docs)

Or run both apps in Docker instead — see [Docker (dev)](#docker-dev) below.

## Commands

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all apps and packages
pnpm typecheck    # TypeScript check across all packages
pnpm lint         # Lint all packages
pnpm test         # Run the Vitest suite across all packages
pnpm format       # Format with Prettier
```

## Testing

Each app and package has its own Vitest suite, run through Turborepo (`pnpm test` / `pnpm turbo test`). We use Vitest instead of Jest — it reuses the Vite/esbuild transform pipeline, so there's no separate ts-jest/babel config to keep in sync with the rest of the toolchain, and it's noticeably faster in watch mode.

- `packages/types` — schema validation (`waitlist.test.ts`)
- `packages/ui` — component rendering, via `@testing-library/react` + jsdom (`button.test.tsx`, `input.test.tsx`)
- `apps/web` — the Contentful fetch/parse/sort logic and its fallback path (`contentful.test.ts`, `contentful-success.test.ts`), and the waitlist form's validation, submit, and error states (`WaitlistForm.test.tsx`)
- `apps/api` — service unit tests with a manually-mocked `MailService` and a mocked `Resend` SDK (`waitlist.service.spec.ts`, `mail.service.spec.ts`)

The `apps/api` tests instantiate `WaitlistService` directly (`new WaitlistService(mockMail)`) instead of going through Nest's `TestingModule`. Nest's DI container resolves constructor parameter types from `emitDecoratorMetadata`, which requires a real `tsc` pass — Vitest's default esbuild/oxc transform doesn't emit it. Manual instantiation sidesteps that entirely for plain, constructor-injected services; if you add tests that need the full DI container, wire up [`unplugin-swc`](https://github.com/unplugin-swc/unplugin-swc) in `apps/api/vitest.config.ts`.

Run a single package's tests directly: `pnpm --filter @repo/api test`.

## Docker (dev)

`docker-compose.yml` runs `apps/web` and `apps/api` in containers with hot reload, for people who'd rather not install Node/pnpm locally. It's dev-only — there's no production Dockerfile; see [Deploying](#deploying) for the two supported paths.

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

docker compose up
```

Same ports as running locally: `apps/web` on 3000, `apps/api` on 3001. Source is bind-mounted into both containers, so edits on the host trigger the same watch-mode reload as `pnpm dev`; `node_modules` is excluded from the mount (an anonymous volume) so the Linux-built dependencies inside the container are never overwritten by your host's.

## Adding to this starter

This repo is intentionally minimal. Recommended additions depending on your use case:

| Need     | Add                                                  |
| -------- | ---------------------------------------------------- |
| Database | Prisma (`packages/database`)                         |
| Auth     | NextAuth.js in `apps/web`, guards in `apps/api`      |
| CMS      | Already wired — see `apps/web/src/lib/contentful.ts` |
| Email    | Resend or Nodemailer in `apps/api`                   |
| Payments | Stripe in `apps/api`                                 |

### Example: adding Postgres + Prisma

If you need to persist data — e.g. storing waitlist signups instead of only forwarding them to Resend — Postgres + Prisma is the natural fit. Put it in a shared `packages/database`, the same pattern as `packages/types`: one schema, one generated client, importable from `apps/api` (and `apps/web` too, if it ever needs direct reads) instead of duplicating it per app. `turbo.json` already declares `DATABASE_URL` as a pass-through env var.

**1. Scaffold the package first** — `pnpm --filter` only matches workspace projects that already have a `package.json`, so create that before running any `pnpm --filter @repo/database …` command:

```bash
mkdir -p packages/database/src
```

```json
// packages/database/package.json
{
  "name": "@repo/database",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "typescript": "^5.9.3"
  }
}
```

Add a `tsconfig.json` extending `@repo/config/tsconfig/base.json` and a `tsconfig.build.json` extending that — copy both from `packages/types`, same shape. Then run `pnpm install` once so pnpm registers the new workspace project (it's matched by the existing `packages/*` glob in `pnpm-workspace.yaml`), and only then install Prisma into it:

```bash
pnpm install
pnpm --filter @repo/database add prisma -D
pnpm --filter @repo/database add @prisma/client
pnpm --filter @repo/database exec prisma init
```

`prisma init` creates `packages/database/prisma/schema.prisma` plus a `packages/database/.env` with a placeholder `DATABASE_URL` — the Prisma CLI (`migrate`/`generate`) reads that file. The running server reads its own copy from `apps/api/.env` instead (loaded via `dotenv` in `main.ts`), so set the same value in both — copy one into the other rather than trying to share a single `.env` across packages.

**2. Define a model and re-export the client:**

```prisma
// packages/database/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model WaitlistSignup {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
```

```ts
// packages/database/src/index.ts
export { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
```

**3. Migrate, generate, and consume from `apps/api`:**

```bash
pnpm --filter @repo/database exec prisma migrate dev --name init
pnpm --filter @repo/api add @repo/database --workspace
```

Wire a `PrismaService` in `apps/api/src` that imports `PrismaClient` from `@repo/database` — the same way `MailService` wraps the Resend SDK — and call it from `WaitlistService` alongside (or instead of) `mail.addToAudience`.

**4. Add Postgres to `docker-compose.yml`** so `docker compose up` has a database to talk to locally:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: turborepo
      POSTGRES_PASSWORD: turborepo
      POSTGRES_DB: turborepo
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  api:
    # ...existing api config, add:
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://turborepo:turborepo@postgres:5432/turborepo

volumes:
  postgres-data:
```

Inside `docker compose up`, `apps/api` reaches Postgres via the service name `postgres`, not `localhost` — that's why the compose-level `DATABASE_URL` differs from the one in `apps/api/.env` used by plain `pnpm dev` (which points at `localhost:5432`).

## Deploying

`apps/web` goes to Vercel either way. For `apps/api` there are two supported paths — pick one.

### Path 1 — Railway (managed, fastest)

Everything needed is committed: [`railway.json`](./railway.json) declares the Nixpacks build (`turbo build --filter=@repo/api...`, which builds `@repo/types` first), the start command, and a `/health` healthcheck.

1. New Railway project → deploy from your fork. It picks up `railway.json` automatically.
2. Set the variables from [`apps/api/.env.example`](./apps/api/.env.example) in the Railway dashboard — at minimum `ALLOWED_ORIGIN` (your Vercel URL), plus `RESEND_API_KEY` / `RESEND_AUDIENCE_ID` if you want the waitlist to email.
3. On Vercel, set the project's **Root Directory** to `apps/web` and add `NEXT_PUBLIC_API_URL` pointing at the Railway URL.

`NEXT_PUBLIC_*` values are inlined at build time — changing one in the Vercel dashboard needs a redeploy, not just a save.

### Path 2 — your own VPS (free forever, more control)

[`deploy/`](./deploy) is a complete self-hosting kit: Caddy for TLS-terminating reverse proxy, PM2 for process supervision, and a GitHub Action that redeploys over SSH. [`deploy/README.md`](./deploy/README.md) walks the whole thing end to end on an Oracle Cloud **Always Free** Arm instance (4 OCPU / 24 GB across your tenancy, no card charge), including the parts that are easy to get wrong — the VCN wizard, both firewall layers, and `pm2 startup`.

| File                                                                     | What it's for                                                                                         |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [`deploy/README.md`](./deploy/README.md)                                 | The full provisioning and hardening walkthrough                                                       |
| [`deploy/Caddyfile`](./deploy/Caddyfile)                                 | Reverse proxy + automatic TLS. Swap in your domain                                                    |
| [`deploy/oracle-capacity-retry.sh`](./deploy/oracle-capacity-retry.sh)   | Oracle's free Arm capacity is a lottery — this plays it for you                                       |
| [`deploy/redeploy-api.sh`](./deploy/redeploy-api.sh)                     | Pull, rebuild, `pm2 reload`, health check                                                             |
| [`deploy/verify-security.sh`](./deploy/verify-security.sh)               | Post-deploy checks: headers, rate limiting, CORS                                                      |
| [`.github/workflows/deploy-api.yml`](./.github/workflows/deploy-api.yml) | The same redeploy from Actions. Repo path is derived from the GitHub context, so a fork needs no edit |

The Action needs three repository **secrets** (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`) and writes `apps/api/.env` on the box from repository **variables** — see [`deploy/README.md`](./deploy/README.md) §3.

Behind a reverse proxy the rate limiter needs `trust proxy` and a custom guard, or it keys every client on one bucket. That's `apps/api/src/throttler-behind-proxy.guard.ts`, and the reasoning is in `deploy/README.md`.

## Making it yours

**Read this before you deploy anything.** What ships here is our own live site, not a
neutral template with the logo taken out. Clone it, run it, and you get a working Dev
and Deliver landing page — our wordmark, our copy, our blog links. That is
deliberate: a starter you can see running end to end teaches more than one stubbed down
to placeholders. It does mean the last mile is yours, and it is not a checkbox — expect
to spend an hour in the components, not five minutes in a config file.

Anything reachable by env var is listed in the two `.env.example` files. The rest is
hardcoded, and here is all of it:

| File                                                                                               | What's ours                                                                    |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`apps/web/src/components/nav/Navbar.tsx`](./apps/web/src/components/nav/Navbar.tsx)               | Inline logo SVG (~5KB `<path>`), links to devanddeliver.com                    |
| [`apps/web/src/components/footer/Footer.tsx`](./apps/web/src/components/footer/Footer.tsx)         | The same inline logo, blog + LinkedIn links, copyright line                    |
| [`apps/web/src/app/layout.tsx`](./apps/web/src/app/layout.tsx)                                     | Page title, description, OG/Twitter metadata, `OG_IMAGE`                       |
| [`apps/web/src/lib/contentful.ts`](./apps/web/src/lib/contentful.ts)                               | Fallback hero copy, feature list, and six article teasers pointing at our blog |
| [`apps/web/src/components/articles/Articles.tsx`](./apps/web/src/components/articles/Articles.tsx) | Section heading and the "devanddeliver.com" link                               |
| [`apps/web/src/lib/site.ts`](./apps/web/src/lib/site.ts)                                           | Contact email, GitHub URL, and the Cal defaults below                          |
| [`apps/api/src/main.ts`](./apps/api/src/main.ts)                                                   | Swagger document title                                                         |
| [`LICENSE`](./LICENSE)                                                                             | MIT, copyright Dev and Deliver — keep the notice if you keep the code          |

The logo is the one people miss. It is an inline `<svg>` in two components rather than a
file import, so a search for `.svg` finds nothing. Replace both, or swap them for a text
wordmark — it is a `<path d="…">` inside an `<a>`, nothing clever.

### The calendar points at a demo event

`CAL_URL` and `CAL_LINK` in `site.ts` default to `cal.com` and
`rick/get-rick-rolled` — Cal.com's own public demo event — so the Contact section renders
a real, working calendar the first time you run `pnpm dev`. You get to see the section
finished instead of debugging an empty box, and a booking made before you have configured
anything lands nowhere real.

**Change both before you deploy**, or your visitors will book against the demo instead of
you. Set `NEXT_PUBLIC_CAL_URL` and `NEXT_PUBLIC_CAL_LINK` to your own Cal (hosted
[cal.com](https://cal.com) or self-hosted). `next.config.ts` reads the same constant to
build the CSP, so a host you set in env is admitted automatically — nothing else to
update.

The same applies to `OG_IMAGE` in `layout.tsx`: it points at an asset on our CDN so the
tags are not empty. Note that it is a stand-in, not a finished card — it is AVIF at
1294×878, and Facebook, LinkedIn and X neither decode AVIF reliably nor get the 1.91:1
crop they want. Replace it with your own **1200×630 JPEG or PNG** and update the
dimensions next to it.

### What you do not have to configure

Nothing is required to boot. With no Contentful credentials the page renders the static
fallback content in `contentful.ts`; with no `RESEND_API_KEY` the waitlist still
validates and accepts signups, logging a warning instead of emailing. That is on purpose
— you should be able to judge the thing before signing up for anything.

### Going further

The architectural decisions here — why a monorepo, why NestJS, why raw `fetch` over the
Contentful SDK, why pnpm with a hoisted linker — are written up in full on the
[Dev and Deliver blog](https://devanddeliver.com/blog), including the parts that went
wrong. If something in this repo looks like an odd choice, the reasoning is probably
there. Questions, or want us to build something on top of this? [Get in
touch](https://devanddeliver.com).

## Why pnpm?

We moved from Yarn Berry to pnpm. pnpm's default strict, symlinked `node_modules` can resolve multiple copies of `reflect-metadata` across packages, which breaks NestJS's decorator metadata in non-obvious ways. `.npmrc` sets `node-linker=hoisted`, which flattens `node_modules` the same way Yarn's `nodeLinker: node-modules` did — decorator metadata resolves correctly, verified by booting `apps/api` under it.

## Why TypeScript 5.9 and not 6 or 7?

NestJS 11 relies on `experimentalDecorators` and `emitDecoratorMetadata`. TypeScript 6 changed decorator semantics enough that compatibility isn't guaranteed, and 7 builds on those same changes — so we're staying on the last 5.x release until NestJS officially supports the new decorator model.

## License

MIT
