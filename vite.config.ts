// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Force the Nitro build with the Vercel preset. Without this, a non-Lovable
  // build (e.g. on Vercel) skips Nitro and produces an incomplete bundle with
  // no SSR function.
  //
  // The Lovable config defaults Nitro's output to dist/ (server/ + client/),
  // which doesn't match what the Vercel preset emits in its config.json
  // (functions/__server.func + static). We override the output dirs so the
  // build produces a valid Vercel Build Output API bundle at `.vercel/output`,
  // which Vercel auto-detects and serves with no extra setup.
  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
