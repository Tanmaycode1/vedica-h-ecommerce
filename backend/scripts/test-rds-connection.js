/**
 * This script tests the connection to the AWS RDS database
 * Run with: node scripts/test-rds-connection.js
 */

const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Parse the DB_SSL environment variable
const useSSL = process.env.DB_SSL === 'true';

// Configure SSL based on environment
const sslConfig = useSSL ? {
  rejectUnauthorized: false,  // Accept self-signed certs, important for RDS
} : false;

const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig,
  connectionTimeoutMillis: 15000, // 15 seconds
  query_timeout: 20000,           // 20 seconds
};

console.log('Testing connection to RDS with the following configuration:');
console.log(`Host: ${config.host}`);
console.log(`Port: ${config.port}`);
console.log(`User: ${config.user}`);
console.log(`Database: ${config.database}`);
console.log(`SSL: ${useSSL ? 'Enabled' : 'Disabled'}`);
console.log(`Connection timeout: ${config.connectionTimeoutMillis}ms`);

const client = new Client(config);

async function testConnection() {
  try {
    console.log('Connecting to database...');
    console.log('This may take a few moments if the database is in a VPC or has restricted access...');
    
    await client.connect();
    console.log('Connection successful! ✅');
    
    console.log('Running test query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`Current time on database server: ${result.rows[0].current_time}`);
    
    // Test if tables exist
    console.log('Checking for tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('Tables found in database:');
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    } else {
      console.log('No tables found in database. You may need to run migrations.');
    }
    
    console.log('All tests passed! RDS connection is working properly. ✅');
  } catch (err) {
    console.error('❌ Error connecting to RDS:', err.message);
    console.error('Connection details used:');
    console.error(`- Host: ${config.host}`);
    console.error(`- Port: ${config.port}`);
    console.error(`- User: ${config.user}`);
    console.error(`- Database: ${config.database}`);
    console.error(`- SSL: ${useSSL ? 'Enabled' : 'Disabled'}`);
    
    if (err.code === 'ETIMEDOUT') {
      console.error('\nConnection timed out. This could be due to:');
      console.error('1. Security group rules not allowing connections from your IP');
      console.error('2. Network ACLs blocking access');
      console.error('3. RDS instance not publicly accessible');
      console.error('\nCheck your AWS RDS security settings in the console.');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\nHost not found. This could be due to:');
      console.error('1. Incorrect endpoint in DB_HOST');
      console.error('2. DNS resolution issues');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. This could be due to:');
      console.error('1. Wrong port number');
      console.error('2. Database service not running');
    }
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore errors on disconnect
    }
  }
}

testConnection(); 