import { describe, expect, it } from "vitest";
import { fetchArticles, fetchFeatures, fetchHero } from "./contentful";

// CONTENTFUL_SPACE_ID / CONTENTFUL_ACCESS_TOKEN are unset in the test environment,
// so these exercise the static-default fallback path without any network mocking.
describe("contentful fallbacks", () => {
  it("returns the default hero", async () => {
    const hero = await fetchHero();
    expect(hero.headline).toContain("We build things");
  });

  it("returns default features in their authored order", async () => {
    // This fallback path (env vars unset) never calls .sort() — it returns
    // DEFAULT_FEATURES as-is, so this only checks the constant is authored
    // correctly. Actual sort-logic coverage is in contentful-success.test.ts.
    const features = await fetchFeatures();
    expect(features.map((f) => f.order)).toEqual([1, 2, 3]);
  });

  it("returns default articles", async () => {
    const articles = await fetchArticles();
    expect(articles.length).toBeGreaterThan(0);
  });
});
