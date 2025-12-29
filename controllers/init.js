const pool = require("../db");

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Users table ready");
  } catch (err) {
    console.error("❌ DB init failed", err);
    process.exit(1);
  }
}

module.exports = initDB;
