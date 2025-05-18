#!/bin/bash

# Start the PostgreSQL backend server for BigDeal E-commerce
echo "🚀 Starting BigDeal E-commerce Backend Server"
echo "✅ Database: PostgreSQL"
echo "✅ GraphQL adapter: Active"

# Check if database is properly set up
echo "Checking database connection..."
node -e "
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tanmay0786',
  database: process.env.DB_NAME || 'bigdeal_ecommerce',
});

async function checkDb() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) FROM products');
    const productCount = result.rows[0].count;
    
    console.log(\`✅ Database connection successful! (\${productCount} products available)\`);
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Please run ./reset-db.js to set up the database');
    process.exit(1);
  }
}

checkDb();
"

if [ $? -eq 0 ]; then
  # Compile TypeScript code first
  echo "Compiling TypeScript code..."
  npm run build
  
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed. Check the errors above."
    exit 1
  fi
  
  echo "✅ TypeScript compilation successful!"
  
  # Start the server
  echo "Starting server on http://localhost:3001"
  echo "GraphQL endpoint available at http://localhost:3001/graphql"
  npm start
else
  echo "❌ Server startup failed due to database issues"
  exit 1
fi 