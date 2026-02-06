import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: "To be configured",
    databaseId: "elbeg-meat-db-id",
    token: "To be configured",
  },
});
