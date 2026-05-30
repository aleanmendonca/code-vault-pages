import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.VITE_SUPABASE_URL ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    githubToken: process.env.GITHUB_TOKEN ?? "",
  };
}
