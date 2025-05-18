require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');
const fs = require('fs');

// Log file setup
const logFile = fs.createWriteStream('./db-connection-test.log', { flags: 'a' });
const logger = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logFile.write(logMessage + '\n');
};

// Extract connection params from .env file
const connectionParams = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tanmay0786',
  database: process.env.DB_NAME || 'bigdeal_ecommerce',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create a connection string as an alternative
const connectionString = `postgresql://${connectionParams.user}:${connectionParams.password}@${connectionParams.host}:${connectionParams.port}/${connectionParams.database}`;

logger('========== DATABASE CONNECTION TEST ==========');
logger('Test started');
logger(`Node.js version: ${process.version}`);
logger(`Current directory: ${process.cwd()}`);

// Log connection parameters (except password)
logger('Connection parameters:');
logger(JSON.stringify({
  ...connectionParams,
  password: '******' // Hide password in logs
}, null, 2));

// Log environment variables
logger('Environment variables related to DB:');
Object.keys(process.env)
  .filter(key => key.startsWith('DB_'))
  .forEach(key => {
    logger(`${key}: ${key === 'DB_PASSWORD' ? '******' : process.env[key]}`);
  });

// Function to test connection using Pool
async function testPoolConnection() {
  logger('\n--- Testing connection using Pool ---');
  const pool = new Pool(connectionParams);
  
  try {
    logger('Attempting to connect to database using Pool...');
    const client = await pool.connect();
    
    logger('Successfully connected to database!');
    
    logger('Testing simple query...');
    const result = await client.query('SELECT NOW()');
    logger(`Query successful! Current time: ${result.rows[0].now}`);
    
    logger('Checking for tables...');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.rows.length > 0) {
      logger(`Tables found: ${tables.rows.map(row => row.table_name).join(', ')}`);
      
      // Get row counts for important tables
      logger('Checking row counts for key tables...');
      for (const table of ['products', 'collections', 'mega_menu_collections', 'variants']) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
          logger(`Table ${table}: ${countResult.rows[0].count} rows`);
        } catch (err) {
          logger(`Could not count rows in ${table}: ${err.message}`);
        }
      }
    } else {
      logger('No tables found in the database!');
    }
    
    logger('Testing connection pool with multiple queries...');
    const promises = Array(5).fill().map((_, i) => {
      return client.query('SELECT pg_sleep(0.1), $1 as test_value', [`test-${i}`])
        .then(res => logger(`Pool query ${i} completed with value: ${res.rows[0].test_value}`))
        .catch(err => logger(`Pool query ${i} failed: ${err.message}`));
    });
    
    await Promise.all(promises);
    logger('Multiple queries completed');
    
    client.release();
    await pool.end();
    logger('Pool connection closed');
    return true;
  } catch (error) {
    logger(`Database connection error with Pool: ${error.message}`);
    logger(`Full error: ${JSON.stringify(error)}`);
    try {
      await pool.end();
    } catch (e) {}
    return false;
  }
}

// Function to test connection using connection string
async function testConnectionString() {
  logger('\n--- Testing connection using connection string ---');
  const pool = new Pool({ connectionString });
  
  try {
    logger('Attempting to connect to database using connection string...');
    const client = await pool.connect();
    logger('Successfully connected to database with connection string!');
    
    logger('Testing simple query...');
    const result = await client.query('SELECT current_database()');
    logger(`Query successful! Current database: ${result.rows[0].current_database}`);
    
    client.release();
    await pool.end();
    logger('Connection string test completed and connection closed');
    return true;
  } catch (error) {
    logger(`Database connection error with connection string: ${error.message}`);
    try {
      await pool.end();
    } catch (e) {}
    return false;
  }
}

// Run the tests
async function runTests() {
  try {
    const poolTestPassed = await testPoolConnection();
    const stringTestPassed = await testConnectionString();
    
    logger('\n========== TEST RESULTS ==========');
    logger(`Connection using Pool: ${poolTestPassed ? 'PASSED' : 'FAILED'}`);
    logger(`Connection using Connection String: ${stringTestPassed ? 'PASSED' : 'FAILED'}`);
    
    if (poolTestPassed || stringTestPassed) {
      logger('\nDIAGNOSIS: Database connection is working correctly.');
      if (poolTestPassed && !stringTestPassed) {
        logger('NOTE: Only Pool connection works, use separate parameters in your app.');
      } else if (!poolTestPassed && stringTestPassed) {
        logger('NOTE: Only connection string works, consider using connection string in your app.');
      }
      logger('\nRECOMMENDATION: Your application code is likely misconfigured. Check:');
      logger('1. Are you using the correct path to .env file?');
      logger('2. Is your backend code properly loading environment variables?');
      logger('3. Check for typos in variable names in your code.');
    } else {
      logger('\nDIAGNOSIS: Database connection is failing.');
      logger('\nRECOMMENDATION:');
      logger('1. Verify PostgreSQL is running: systemctl status postgresql');
      logger('2. Check PostgreSQL connection settings in pg_hba.conf');
      logger('3. Verify credentials are correct');
      logger('4. Try connecting from another tool to isolate the issue');
    }
    
  } catch (err) {
    logger(`Error running tests: ${err.message}`);
  } finally {
    logFile.end();
    logger('Test completed. Log saved to db-connection-test.log');
  }
}

runTests(); 