import { Pool } from "pg"
import dotenv from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"

// Cargar variables de entorno
dotenv.config();

// Configuración para la base de datos con variables de entorno
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:clancito548@localhost:5432/mariscal_castilla";

if (!process.env.DATABASE_URL) {
  console.error("⚠️ ADVERTENCIA: DATABASE_URL no está configurado. Usando localhost.");
} else {
  console.log("✅ DATABASE_URL configurada correctamente");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export const db = drizzle(pool);