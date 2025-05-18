const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if admin user already exists
  const adminExists = await knex('users')
    .where('email', 'admin@example.com')
    .first();
  
  if (!adminExists) {
    // Create admin user
    const password_hash = await bcrypt.hash('admin123', 10);
    
    await knex('users').insert({
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      password_hash,
      role: 'admin',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex('users')
    .where('email', 'admin@example.com')
    .del();
}; 