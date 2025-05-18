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

async function updateTables() {
  const client = await pool.connect();
  
  try {
    console.log('Starting schema update...');
    
    // Start a transaction
    await client.query('BEGIN');

    // Drop and recreate the product_images table
    console.log('Dropping existing product_images table...');
    await client.query('DROP TABLE IF EXISTS product_images CASCADE');
    
    console.log('Creating product_images table with correct schema...');
    await client.query(`
      CREATE TABLE product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_id VARCHAR(255),
        src VARCHAR(255) NOT NULL,
        alt VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('product_images table updated successfully.');
    
    // Create some sample product images for existing products
    console.log('Adding sample images to products...');
    
    const products = await client.query('SELECT id FROM products LIMIT 100');
    
    for (const product of products.rows) {
      // Add 1-3 sample images for each product
      const imageCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < imageCount; i++) {
        const isPrimary = i === 0; // First image is primary
        const imageId = `img_${product.id}_${i+1}`;
        await client.query(`
          INSERT INTO product_images (product_id, image_id, src, alt, is_primary)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          product.id, 
          imageId,
          `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/800`, 
          `Product ${product.id} image ${i+1}`,
          isPrimary
        ]);
      }
    }
    
    console.log(`Added sample images to ${products.rows.length} products.`);
    
    // Update variants table if it exists
    console.log('Checking variants table schema...');
    
    // Check if image_id column exists in variants table
    const imageIdExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'variants' 
        AND column_name = 'image_id'
      );
    `);
    
    if (!imageIdExists.rows[0].exists) {
      console.log('Adding image_id column to variants table...');
      await client.query(`
        ALTER TABLE variants
        ADD COLUMN image_id VARCHAR(255)
      `);
      
      // Update existing variants with random image IDs
      const variants = await client.query('SELECT id, product_id FROM variants');
      for (const variant of variants.rows) {
        const imageId = `img_${variant.product_id}_variant_${variant.id}`;
        await client.query(`
          UPDATE variants
          SET image_id = $1
          WHERE id = $2
        `, [imageId, variant.id]);
      }
      
      console.log('Updated variants with image_id values.');
    } else {
      console.log('image_id column already exists in variants table.');
    }
    
    // Drop and recreate the product_variants table to match expected schema
    console.log('Updating product_variants table...');
    await client.query('DROP TABLE IF EXISTS product_variants CASCADE');
    
    await client.query(`
      CREATE TABLE product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES variants(id) ON DELETE CASCADE,
        sku VARCHAR(100),
        size VARCHAR(50),
        color VARCHAR(50),
        image_id VARCHAR(255),
        image_url VARCHAR(255),
        price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('product_variants table updated with correct schema.');
    
    // Add sample data to product_variants
    console.log('Adding sample data to product_variants...');
    
    const variants = await client.query('SELECT id, product_id, color, size, price FROM variants LIMIT 150');
    
    for (const variant of variants.rows) {
      const sku = `SKU-${variant.product_id}-${variant.id}`;
      const imageId = `img_${variant.product_id}_variant_${variant.id}`;
      const imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/800`;
      
      await client.query(`
        INSERT INTO product_variants 
        (product_id, variant_id, sku, size, color, image_id, image_url, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        variant.product_id,
        variant.id,
        sku,
        variant.size,
        variant.color,
        imageId,
        imageUrl,
        variant.price
      ]);
    }
    
    console.log(`Added ${variants.rows.length} entries to product_variants table.`);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Schema updated successfully!');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
updateTables().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});