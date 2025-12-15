// npm install pg
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres:thinksys%40123@localhost:5432/postgres'
  });

  try {
    await client.connect();
    const res = await client.query("SELECT datname FROM pg_database ORDER BY datname;");
    console.log(res.rows.map(r => r.datname));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
})();
