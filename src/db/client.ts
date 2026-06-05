import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cloudcodevault";

const queryClient = postgres(connectionString, {
  max: 10,
  ssl: process.env.NODE_ENV === "production" ? "prefer" : false,
});

export const db = drizzle(queryClient);