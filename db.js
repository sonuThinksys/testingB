const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:thinksys%40123@localhost:5432/secure_db"   
});

pool.on('error', (err) => {
  console.error('Unexpected idle client error', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};