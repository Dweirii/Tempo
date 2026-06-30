import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moves connection URLs out of schema.prisma. `datasource.url` here is
// used by migrate/introspect (the DIRECT, non-pooled Neon URL). The runtime
// client connects via the Neon driver adapter (see lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
