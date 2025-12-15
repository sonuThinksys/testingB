require("dotenv").config();
const pool = require('../db');
const fs = require('fs');
const path = require('path');

const migrateAddGoogleAuth = async () => {
  try {
    console.log('Starting migration to add Google authentication support...');
    
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
    
    // Check if google_id column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'google_id';
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('Google authentication columns already exist. No migration needed.');
      return;
    }
    
    console.log('Adding google_id column...');
    await pool.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE');
    
    console.log('Making password column nullable for Google-authenticated users...');
    await pool.query('ALTER TABLE "user" ALTER COLUMN password DROP NOT NULL');
    
    console.log('Creating index on google_id...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_google_id ON "user"(google_id)');
    
    console.log('✅ Migration completed successfully!');
    console.log('Google authentication support has been added to the user table.');
    
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
  migrateAddGoogleAuth()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAddGoogleAuth };
