// Script to run just a single migration file
const path = require('path');
const knex = require('knex');
require('dotenv').config();

// Create knex instance
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'tanmay0786',
    database: process.env.DB_NAME || 'bigdeal_ecommerce',
  },
  migrations: {
    directory: path.join(__dirname, 'src', 'db', 'migrations'),
  },
});

async function runMigration() {
  try {
    // Initialize migrations table
    await db.migrate.latest({ migrationSource: {
      // Only run the comprehensive migration file
      getMigrations: () => Promise.resolve(['01_create_tables.ts']),
      getMigrationName: migration => migration,
      getMigration: migration => {
        // Require the migration file directly
        return require(path.join(__dirname, 'src', 'db', 'migrations', migration));
      }
    }});
    
    console.log('Migration 01_create_tables.ts completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 