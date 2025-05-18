// Script to directly add is_featured column to products table
require('dotenv').config();
const knex = require('knex');

// Initialize knex with the configuration
const db = knex({
  client: process.env.DB_CLIENT || 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bigdeal_ecommerce',
  }
});

async function addFeaturedColumn() {
  try {
    console.log('Starting to add is_featured column to products table...');
    
    // Check if column already exists to avoid errors
    const hasColumn = await db.schema.hasColumn('products', 'is_featured');
    
    if (hasColumn) {
      console.log('Column is_featured already exists in products table.');
    } else {
      // Add the column
      await db.schema.alterTable('products', table => {
        table.boolean('is_featured').defaultTo(false);
        console.log('Added is_featured column to products table');
      });
      console.log('Column is_featured successfully added to products table.');
    }
    
    console.log('Migration completed.');
    
    // Now set featured products
    console.log('Now running script to set featured products...');
    
    // Get all product IDs
    const products = await db('products').select('id', 'title');
    console.log(`Found ${products.length} products total.`);
    
    if (products.length === 0) {
      console.error('No products found in the database.');
      process.exit(1);
    }
    
    // Choose 15 random products or all if less than 15
    const numToFeature = Math.min(15, products.length);
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffled.slice(0, numToFeature);
    
    console.log(`Setting is_featured=true for ${numToFeature} products:`);
    
    // Update each selected product
    for (const product of selectedProducts) {
      await db('products')
        .where('id', product.id)
        .update({ is_featured: true });
      
      console.log(`  - Product #${product.id}: "${product.title}" marked as featured`);
    }
    
    console.log('\nOperation completed successfully.');
    
    // Count how many products are now featured
    const featuredCount = await db('products')
      .where('is_featured', true)
      .count('id as count')
      .first();
    
    console.log(`Total featured products in database: ${featuredCount.count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await db.destroy();
    process.exit(0);
  }
}

// Run the migration
addFeaturedColumn(); 