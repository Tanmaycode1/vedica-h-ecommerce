import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface KnexConfig {
  [key: string]: object;
}

// Use environment variables for database connection
const config: KnexConfig = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'tanmay0786',
      database: process.env.DB_NAME || 'bigdeal_ecommerce',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
    pool: {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 60000,
      idleTimeoutMillis: 60000
    },
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'tanmay0786',
      database: process.env.DB_NAME || 'bigdeal_ecommerce',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 60000,
      idleTimeoutMillis: 60000
    },
  },
};

export default config; 