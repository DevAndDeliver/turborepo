import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unlike contentful.test.ts, these set CONTENTFUL_SPACE_ID/ACCESS_TOKEN
// *before* importing the module, since contentful.ts reads them into
// module-scope consts at import time. vi.resetModules() + a fresh dynamic
// import per test keeps that env-at-import-time coupling from leaking
// between test cases.
describe("contentful — success path (env vars set)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env["CONTENTFUL_SPACE_ID"] = "space123";
    process.env["CONTENTFUL_ACCESS_TOKEN"] = "token123";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env["CONTENTFUL_SPACE_ID"];
    delete process.env["CONTENTFUL_ACCESS_TOKEN"];
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetchHero parses and returns the entry's fields", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ fields: { headline: "Custom headline", subline: "Custom sub", ctaLabel: "Go" } }],
      }),
    });

    const { fetchHero } = await import("./contentful");
    const hero = await fetchHero();
    expect(hero.headline).toBe("Custom headline");
  });

  it("fetchFeatures sorts entries by order", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { fields: { order: 2, title: "B", description: "b" } },
          { fields: { order: 1, title: "A", description: "a" } },
        ],
      }),
    });

    const { fetchFeatures } = await import("./contentful");
    const features = await fetchFeatures();
    expect(features.map((f) => f.title)).toEqual(["A", "B"]);
  });

  it("falls back to defaults when the Contentful request fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });

    const { fetchHero } = await import("./contentful");
    const hero = await fetchHero();
    expect(hero.headline).toContain("We build things");
  });

  it("falls back to defaults when fetch itself throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));

    const { fetchArticles } = await import("./contentful");
    const articles = await fetchArticles();
    expect(articles.length).toBeGreaterThan(0);
  });
});
