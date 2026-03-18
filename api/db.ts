

import { Pool } from "pg"
import dotenv from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres";

// Configuración directa para la base de datos
const DATABASE_URL = "postgresql://postgres:clancito548@localhost:5432/mariscal_castilla";

export const pool = new Pool({
  connectionString: DATABASE_URL
})

export const db = drizzle(pool);