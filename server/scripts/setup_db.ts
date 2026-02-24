import { pool } from "../db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function ensure() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        username text UNIQUE,
        password text,
        nombre text,
        rol text
      )
    `);

    // classrooms
    await client.query(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id serial PRIMARY KEY,
        nombre text NOT NULL,
        turno text NOT NULL
      )
    `);

    // teachers
    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        nombre text NOT NULL,
        email text NOT NULL
      )
    `);

    // students
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id serial PRIMARY KEY,
        nombre text NOT NULL,
        dni text UNIQUE NOT NULL,
        classroom_id integer REFERENCES classrooms(id),
        user_id integer REFERENCES users(id)
      )
    `);

    // attendance
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id serial PRIMARY KEY,
        student_id integer REFERENCES students(id) NOT NULL,
        fecha date NOT NULL,
        estado text NOT NULL,
        registrado_por integer REFERENCES users(id) NOT NULL
      )
    `);

    // ensure admin user exists
    const res = await client.query("SELECT id FROM users WHERE username=$1", ["admin"]);
    if (res.rowCount === 0) {
      const hashed = await hashPassword("admin123");
      await client.query(
        "INSERT INTO users (username, password, nombre, rol) VALUES ($1,$2,$3,$4)",
        ["admin", hashed, "Directora Mariscal Castilla", "DIRECTORA"],
      );
      console.log("Admin user created: username=admin password=admin123");
    } else {
      console.log("Admin user already exists");
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error ensuring schema:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

ensure();
