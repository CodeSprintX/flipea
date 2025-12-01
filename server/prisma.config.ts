// prisma.config.ts
import { defineConfig, env } from "@prisma/config";
import 'dotenv/config'; // Ensures .env is loaded early

export default defineConfig({
  schema: "./prisma/schema.prisma",

  datasource: {
    url: env("DIRECT_URL"), // CLI uses this direct connection for migrations/introspection
    // shadowDatabaseUrl: env("SHADOW_DATABASE_URL"), // Optional: Only if using shadow DB for testing
  },
});