// Site identity in one place.
//
// Every value here is a placeholder you are expected to replace — either by
// editing the fallback, or by setting the matching NEXT_PUBLIC_* variable
// (see apps/web/.env.example). Keeping them in one file means configuring a
// fork is one file, not a hunt.
//
// NEXT_PUBLIC_* is inlined at build time — setting one in Vercel requires a
// redeploy, not just a variable edit.
export const CONTACT_EMAIL = env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, "hello@yourdomain.com");

// These two default to Cal.com's own public demo event ("Get Rickrolled", the
// link Cal uses throughout its embed documentation), so the booking section
// renders the moment you run `pnpm dev` rather than showing an empty box you
// have to debug before you can see the design.
//
// Deliberately NOT a real person's calendar: a default pointing at someone's
// actual availability means every fork that deploys without reading this file
// takes bookings into a stranger's diary. Point both at your own Cal — hosted
// or self-hosted — before you deploy. next.config.ts imports DEFAULT_CAL_URL
// so the CSP admits the same host with no env set.
export const DEFAULT_CAL_URL = "https://cal.com";
export const CAL_URL = stripTrailingSlash(env(process.env.NEXT_PUBLIC_CAL_URL, DEFAULT_CAL_URL));
export const CAL_LINK = env(process.env.NEXT_PUBLIC_CAL_LINK, "rick/get-rick-rolled");
export const GITHUB_URL = env(
  process.env.NEXT_PUBLIC_GITHUB_URL,
  "https://github.com/devanddeliver/turborepo-starter",
);

// CAL_LINK is `username/event-type`, not a bare username. A bare username is a
// profile page that 307s to the default event, and the embed requests
// `/<CAL_LINK>/embed` directly — which it can't follow, so it renders nothing.
//
// CAL_URL is the host only. Putting the username in it makes the embed script
// resolve to `/<username>/embed/embed.js`, which 404s.

// A trailing slash pasted into the dashboard is invisible there and produces
// `https://host//waitlist` at the call site, which a redirect-following server
// answers with a 307 — and a CORS preflight may not follow redirects, so it
// surfaces as an unrelated-looking CORS error.
export const API_URL = stripTrailingSlash(
  env(process.env.NEXT_PUBLIC_API_URL, "http://localhost:3001"),
);

// An empty dashboard field is "unset", not "". `??` only falls back on
// null/undefined, so a variable someone cleared but didn't delete silently
// wins over the default — and an empty calLink makes Cal throw
// "calLink is required" mid-render, which shows up as a section that just
// doesn't paint rather than as a config error.
function env(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
