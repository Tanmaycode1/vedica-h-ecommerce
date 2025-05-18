// Script to create an admin user in the database
require('dotenv').config();
const knex = require('knex');
const bcrypt = require('bcrypt');
const path = require('path');

// Database connection config (copied from knexfile.ts)
const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'tanmay0786',
    database: process.env.DB_NAME || 'bigdeal_ecommerce',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  }
};

// Create DB connection
const db = knex(config);

async function createAdminUser() {
  try {
    console.log('Connecting to database...');
    
    // Check if admin user already exists
    const existingAdmin = await db('users')
      .where('email', 'admin@example.com')
      .first();
    
    if (existingAdmin) {
      console.log('\nAdmin user already exists:');
      console.log(`ID: ${existingAdmin.id}`);
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      return;
    }
    
    // Create password hash
    const password = 'admin123'; // Strong password should be used in production
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert admin user
    const [userId] = await db('users')
      .insert({
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        password_hash,
        role: 'admin',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('id');
    
    console.log('\nAdmin user created successfully:');
    console.log(`ID: ${userId}`);
    console.log(`Email: admin@example.com`);
    console.log(`Password: ${password} (please change this after first login)`);
    console.log(`Role: admin`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close database connection
    await db.destroy();
    console.log('\nDatabase connection closed.');
  }
}

// Run the creation
createAdminUser(); 