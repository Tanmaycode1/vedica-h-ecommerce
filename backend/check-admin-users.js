// Script to check for admin users in the database
require('dotenv').config();
const knex = require('knex');
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

async function checkAdminUsers() {
  try {
    console.log('Connecting to database...');
    
    // First, let's check the actual structure of the users table
    const hasTable = await db.schema.hasTable('users');
    if (!hasTable) {
      console.log('Error: Users table does not exist in the database!');
      return;
    }
    
    // Get column information to determine the actual structure
    const tableInfo = await db('users').columnInfo();
    console.log('\n===== USERS TABLE STRUCTURE =====');
    console.log('Columns in users table:', Object.keys(tableInfo).join(', '));
    
    // Query all users where role is 'admin'
    const adminUsers = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at')
      .where('role', 'admin')
      .orderBy('created_at', 'desc');
    
    console.log('\n===== ADMIN USERS =====');
    
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database.');
    } else {
      console.log(`Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((user, index) => {
        console.log(`\nAdmin User #${index + 1}:`);
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.first_name} ${user.last_name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Created: ${user.created_at}`);
      });
    }
    
    // Also check for any other roles in the system
    const roles = await db('users')
      .distinct('role')
      .select('role');
    
    console.log('\n===== AVAILABLE ROLES =====');
    console.log('Roles found in the system:');
    roles.forEach(r => console.log(`- ${r.role}`));
    
    // Count users by role
    const userCounts = await db('users')
      .select('role')
      .count('* as count')
      .groupBy('role');
    
    console.log('\n===== USER COUNTS BY ROLE =====');
    userCounts.forEach(stat => {
      console.log(`${stat.role}: ${stat.count} user(s)`);
    });
    
  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    // Close database connection
    await db.destroy();
    console.log('\nDatabase connection closed.');
  }
}

// Run the check
checkAdminUsers(); 