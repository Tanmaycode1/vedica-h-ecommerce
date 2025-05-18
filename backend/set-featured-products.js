/**
 * Script to set 15 random products as featured
 */
require('dotenv').config();
const knex = require('knex');

// Initialize knex with the configuration
const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bigdeal',
  },
  pool: { min: 0, max: 7 }
});

async function setFeaturedProducts() {
  try {
    console.log('Starting to set featured products...');
    
    // Check if the is_featured column exists
    const hasColumn = await db.schema.hasColumn('products', 'is_featured');
    
    if (!hasColumn) {
      console.error('Column is_featured does not exist in products table.');
      console.log('Please run the migration first: npm run migrate');
      process.exit(1);
    }
    
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
    console.error('Error setting featured products:', error);
  } finally {
    // Close the database connection
    await db.destroy();
  }
}

// Run the function
setFeaturedProducts(); 