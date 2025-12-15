const fs = require('fs');
const path = require('path');
const pool = require('../db');

const initDatabase = async () => {
  try {
    // Test database connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');
    
    // Initialize user table
    const userSqlFilePath = path.join(__dirname, '../data/user_data.sql');
    const userSql = fs.readFileSync(userSqlFilePath, 'utf8');
    
    const userTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user'
      );
    `);
    
    if (!userTableCheck.rows[0].exists) {
      console.log('Creating user table from user_data.sql...');
      await pool.query(userSql);
      console.log('User table created successfully from user_data.sql!');
    } else {
      console.log('User table already exists.');
    }
    
    // Initialize car table
    const carSqlFilePath = path.join(__dirname, '../data/car_data.sql');
    const carSql = fs.readFileSync(carSqlFilePath, 'utf8');
    
    const carTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'car'
      );
    `);
    
    if (!carTableCheck.rows[0].exists) {
      console.log('Creating car table from car_data.sql...');
      await pool.query(carSql);
      console.log('Car table created successfully from car_data.sql!');
    } else {
      console.log('Car table already exists.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection Error Help:');
      console.error('   - If using Docker: Make sure DATABASE_URL uses service name (e.g., "db") not "localhost"');
      console.error('   - If using docker-compose: Run "docker-compose up -d" to start both services');
      console.error('   - Check that PostgreSQL is running and accessible');
      console.error(`   - Current DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'NOT SET'}`);
    }
    
    throw error;
  }
};

module.exports = { initDatabase };

