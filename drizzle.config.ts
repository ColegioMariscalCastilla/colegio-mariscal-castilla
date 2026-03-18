import { defineConfig } from "drizzle-kit";

// Usar la misma configuración que server/db.ts
const DATABASE_URL = "postgresql://postgres:clancito548@localhost:5432/mariscal_castilla";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
