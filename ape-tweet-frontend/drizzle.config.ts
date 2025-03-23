import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not defined");

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
