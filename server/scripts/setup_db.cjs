const { Pool } = require('pg');
const { scryptSync, randomBytes } = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = scryptSync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function ensure() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // create table if missing and add columns safely
    await client.query(`CREATE TABLE IF NOT EXISTS users (id serial PRIMARY KEY)`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username text`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password text`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS nombre text`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rol text`);
    // ensure email column exists and allow nulls (some existing schemas have email NOT NULL)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`);
    try { await client.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`); } catch (e) {}

    await client.query(`CREATE TABLE IF NOT EXISTS classrooms (id serial PRIMARY KEY)`);
    await client.query(`ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS nombre text`);
    await client.query(`ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS turno text`);

    await client.query(`CREATE TABLE IF NOT EXISTS teachers (id serial PRIMARY KEY)`);
    await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS user_id integer`);
    await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS nombre text`);
    await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email text`);

    await client.query(`CREATE TABLE IF NOT EXISTS students (id serial PRIMARY KEY)`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS nombre text`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS dni text`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS classroom_id integer`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id integer`);
    // add unique index on dni if possible
    try { await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS students_dni_unique ON students(dni)`); } catch(e) {}

    await client.query(`CREATE TABLE IF NOT EXISTS attendance (id serial PRIMARY KEY)`);
    await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS student_id integer`);
    await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS fecha date`);
    await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS estado text`);
    await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS registrado_por integer`);

    const res = await client.query('SELECT id FROM users WHERE username=$1', ['admin']);
    if (res.rowCount === 0) {
      const hashed = hashPassword('admin123');
      // provide an email to satisfy schemas that have email NOT NULL
      await client.query('INSERT INTO users (username, password, nombre, rol, email) VALUES ($1,$2,$3,$4,$5)', ['admin', hashed, 'Directora Mariscal Castilla', 'directora', 'admin@example.local']);
      console.log('Admin user created: username=admin password=admin123');
    } else {
      console.log('Admin user already exists');
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error ensuring schema:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

ensure();
