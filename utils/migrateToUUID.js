require("dotenv").config();
const pool = require('../db');

const migrateToUUID = async () => {
  try {
    console.log('Starting migration from BIGINT to UUID...');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('User table does not exist. No migration needed.');
      return;
    }
    
    // Check current column type
    const columnCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'id';
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('ID column does not exist. No migration needed.');
      return;
    }
    
    const currentType = columnCheck.rows[0].data_type;
    
    if (currentType === 'uuid') {
      console.log('Table already uses UUID. No migration needed.');
      return;
    }
    
    if (currentType !== 'bigint' && currentType !== 'integer') {
      console.log(`Unexpected column type: ${currentType}. Migration may not work correctly.`);
      console.log('Proceeding anyway...');
    }
    
    console.log(`Current ID type: ${currentType}`);
    console.log('Migrating to UUID...');
    
    // Check PostgreSQL version for UUID function
    const versionResult = await pool.query('SELECT version()');
    const version = versionResult.rows[0].version;
    const majorVersion = parseInt(version.match(/PostgreSQL (\d+)/)?.[1] || '0');
    
    const uuidFunction = majorVersion >= 13 ? 'gen_random_uuid()' : 'uuid_generate_v4()';
    
    if (majorVersion < 13) {
      console.log('PostgreSQL version < 13 detected. Enabling uuid-ossp extension...');
      try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('uuid-ossp extension enabled.');
      } catch (extError) {
        console.error('Failed to enable uuid-ossp extension:', extError.message);
        throw extError;
      }
    }
    
    // Step 1: Add a new UUID column
    console.log('Step 1: Adding new UUID column...');
    await pool.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS id_new UUID');
    
    // Step 2: Generate UUIDs for existing rows
    console.log('Step 2: Generating UUIDs for existing rows...');
    await pool.query(`UPDATE "user" SET id_new = ${uuidFunction} WHERE id_new IS NULL`);
    
    // Step 3: Drop the old primary key constraint
    console.log('Step 3: Dropping old primary key constraint...');
    await pool.query('ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_pkey');
    
    // Step 4: Drop the old id column
    console.log('Step 4: Dropping old id column...');
    await pool.query('ALTER TABLE "user" DROP COLUMN IF EXISTS id');
    
    // Step 5: Rename the new column to id
    console.log('Step 5: Renaming new column to id...');
    await pool.query('ALTER TABLE "user" RENAME COLUMN id_new TO id');
    
    // Step 6: Set it as NOT NULL and PRIMARY KEY
    console.log('Step 6: Setting NOT NULL and PRIMARY KEY...');
    await pool.query('ALTER TABLE "user" ALTER COLUMN id SET NOT NULL');
    await pool.query('ALTER TABLE "user" ADD PRIMARY KEY (id)');
    
    // Step 7: Set default value for future inserts
    console.log('Step 7: Setting default UUID generation...');
    await pool.query(`ALTER TABLE "user" ALTER COLUMN id SET DEFAULT ${uuidFunction}`);
    
    // Step 8: Add role column if it doesn't exist
    console.log('Step 8: Adding role column if needed...');
    await pool.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT');
    
    console.log('✅ Migration completed successfully!');
    console.log('All user IDs have been converted to UUIDs.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    throw error;
  } finally {
    await pool.pool.end();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToUUID()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToUUID };
