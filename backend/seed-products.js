const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tanmay0786',
  database: process.env.DB_NAME || 'bigdeal_ecommerce',
  ssl: false
});

// Sample data for generating products
const categories = ['Clothing', 'Electronics', 'Home & Kitchen', 'Beauty', 'Toys'];
const brands = ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E'];

async function seedProducts() {
  const client = await pool.connect();
  
  try {
    console.log('===== STARTING PRODUCT DATABASE SEEDING =====');
    
    // Start a transaction
    await client.query('BEGIN');

    // Clear existing products
    await client.query('DELETE FROM product_images');
    await client.query('DELETE FROM product_variants');
    await client.query('DELETE FROM product_collections');
    await client.query('DELETE FROM products');
    
    console.log('Cleared existing product data');
    
    // Create 50 sample products
    const productCount = 50;
    const randomPrice = () => Math.floor(Math.random() * 900) + 100 + Math.random();
    const randomStock = () => Math.floor(Math.random() * 1000);
    const randomBoolean = () => Math.random() > 0.7;
    
    for (let i = 0; i < productCount; i++) {
      // Generate product details
      const category = categories[Math.floor(Math.random() * categories.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const title = `${brand} ${category} Product ${i+1}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const description = `This is a great ${category} product from ${brand}.`;
      const price = randomPrice().toFixed(2);
      const isNew = randomBoolean();
      const isSale = !isNew && randomBoolean();
      const discount = isSale ? (Math.floor(Math.random() * 30) + 10).toFixed(2) : '0.00';
      const stock = randomStock();
      const imageUrl = [`https://picsum.photos/id/${i+100}/800/800`];
      
      // Insert product
      const result = await client.query(`
        INSERT INTO products
        (title, slug, description, price, image_url, category, brand, discount, stock, is_new, is_sale, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id;
      `, [
        title, 
        slug, 
        description, 
        price,
        imageUrl,
        category, 
        brand, 
        discount, 
        stock, 
        isNew, 
        isSale
      ]);
      
      const productId = result.rows[0].id;
      
      // Add product images
      const imageCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < imageCount; j++) {
        const isPrimary = j === 0;
        const imageId = `img_${productId}_${j+1}`;
        await client.query(`
          INSERT INTO product_images (product_id, image_id, src, alt, is_primary)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          productId, 
          imageId,
          `https://picsum.photos/id/${i*10 + j + 100}/800/800`, 
          `Product ${productId} image ${j+1}`,
          isPrimary
        ]);
      }
      
      console.log(`Created product: ${title} (ID: ${productId})`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('\n===== PRODUCT SEEDING COMPLETED SUCCESSFULLY =====');
    console.log(`Seeded ${productCount} products with images`);
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('\n===== ERROR DURING PRODUCT SEEDING =====');
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
seedProducts().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});