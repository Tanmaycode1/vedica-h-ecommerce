// Simple script to reset database
const { Pool } = require('pg');
const { spawn } = require('child_process');
require('dotenv').config();

// Check if SSL is enabled
const useSSL = process.env.DB_SSL === 'true';

// Create connection pool with proper SSL configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tanmay0786',
  database: process.env.DB_NAME || 'bigdeal_ecommerce',
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  // Add connection timeout settings
  connectionTimeoutMillis: 10000, // 10 seconds
  query_timeout: 30000, // 30 seconds
});

const resetDb = async () => {
  let client;
  try {
    console.log('Connecting to database:', process.env.DB_HOST);
    // Connect to database
    client = await pool.connect();
    console.log('Connected to database');

    // Drop all tables, using cascade to handle dependencies
    await client.query(`
      DROP TABLE IF EXISTS product_collections CASCADE;
      DROP TABLE IF EXISTS product_variants CASCADE;
      DROP TABLE IF EXISTS product_images CASCADE;
      DROP TABLE IF EXISTS collections CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS currencies CASCADE;
      DROP TABLE IF EXISTS knex_migrations CASCADE;
      DROP TABLE IF EXISTS knex_migrations_lock CASCADE;
    `);

    console.log('All tables dropped successfully');

    // Create tables directly using the SQL from the migration file
    console.log('Creating tables with direct SQL...');
    
    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NULL,
        last_name VARCHAR(255) NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        firebase_uid VARCHAR(255) NULL UNIQUE,
        role VARCHAR(255) DEFAULT 'customer',
        phone VARCHAR(255) NULL,
        address JSONB NULL,
        email_verified BOOLEAN DEFAULT false,
        avatar VARCHAR(255) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create collections table
    await client.query(`
      CREATE TABLE collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        image VARCHAR(255),
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create products table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50),
        brand VARCHAR(100),
        category VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL,
        is_new BOOLEAN DEFAULT false,
        is_sale BOOLEAN DEFAULT false,
        discount INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create product variants table
    await client.query(`
      CREATE TABLE product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(50),
        size VARCHAR(20),
        color VARCHAR(50),
        image_id INTEGER NULL,
        price DECIMAL(10, 2) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create product images table
    await client.query(`
      CREATE TABLE product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_id INTEGER,
        alt VARCHAR(255),
        src VARCHAR(255) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create product_collections table
    await client.query(`
      CREATE TABLE product_collections (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
        UNIQUE(product_id, collection_id)
      );
    `);

    // Create orders table
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending',
        total DECIMAL(10, 2) NOT NULL,
        shipping_method VARCHAR(50),
        shipping_cost DECIMAL(10, 2),
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending',
        tracking_number VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create order_items table
    await client.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create currencies table
    await client.query(`
      CREATE TABLE currencies (
        id SERIAL PRIMARY KEY,
        currency VARCHAR(3) NOT NULL UNIQUE,
        symbol VARCHAR(10) NOT NULL,
        value DECIMAL(10, 4) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('All tables created successfully');
    
    // Create knex migrations tracking table to prevent future migration runs
    await client.query(`
      CREATE TABLE knex_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        batch INTEGER,
        migration_time TIMESTAMPTZ
      );
    `);
    
    await client.query(`
      CREATE TABLE knex_migrations_lock (
        index SERIAL PRIMARY KEY,
        is_locked INTEGER
      );
    `);
    
    // Insert migration records to mark all migrations as complete
    await client.query(`
      INSERT INTO knex_migrations (name, batch, migration_time) VALUES
      ('20240601000000_create_users_table.ts', 1, CURRENT_TIMESTAMP),
      ('20240601000001_create_products_table.ts', 1, CURRENT_TIMESTAMP),
      ('20240601000002_create_product_images_table.ts', 1, CURRENT_TIMESTAMP),
      ('20240601000003_create_product_variants_table.ts', 1, CURRENT_TIMESTAMP),
      ('20240601000004_create_collections_table.ts', 1, CURRENT_TIMESTAMP),
      ('20240601000005_create_orders_table.ts', 1, CURRENT_TIMESTAMP),
      ('01_create_tables.ts', 1, CURRENT_TIMESTAMP);
    `);
    
    console.log('Migration records created');
    client.release();
    client = null;
    
    // Run the seed
    console.log('Running seeds...');
    const seed = spawn('npm', ['run', 'seed'], { stdio: 'inherit' });
    
    seed.on('close', (code) => {
      if (code === 0) {
        console.log('Database seeding completed successfully');
      } else {
        console.error('Seeding failed with code:', code);
      }
      pool.end(() => process.exit(code));
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Add error handling for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

resetDb(); 