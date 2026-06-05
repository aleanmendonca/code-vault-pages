import process from "node:process";

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parseInt(process.env.PORT ?? "3000", 10),
    databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cloudcodevault",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
    cronSecret: process.env.CRON_SECRET ?? "",
    uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
    githubToken: process.env.GITHUB_TOKEN ?? "",
  };
}

export function requireJwtSecret(): string {
  const secret = getServerConfig().jwtSecret;
  if (!secret || secret === "dev-secret-change-in-production") {
    console.warn("[WARN] Using default JWT secret. Set JWT_SECRET in production!");
  }
  return secret;
}