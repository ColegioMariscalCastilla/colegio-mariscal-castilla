require('dotenv').config();
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT conname, pg_get_constraintdef(c.oid) as def FROM pg_constraint c WHERE c.conrelid = 'users'::regclass");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
