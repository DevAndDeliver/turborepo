import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Next resolves "@/*" from tsconfig paths; Vitest doesn't read those, so
      // any test touching a file that imports "@/..." fails to resolve without this.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  oxc: {
    // apps/web's tsconfig sets jsx: "preserve" for Next's own SWC/webpack
    // pipeline. Vitest has no separate JSX-transform step of its own to
    // fall back on, so it needs an explicit override here.
    jsx: { runtime: "automatic" },
  },
});
