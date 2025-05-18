/**
 * Database Seed Script for BigDeal E-commerce
 * 
 * This script will populate the database with initial data for:
 * - Products
 * - Collections
 * - Currencies
 * 
 * Run with: node src/seeds/seed-data.js
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bigdeal_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Sample currency data
const currencies = [
  { currency: 'INR', symbol: '₹', value: 1 },
  { currency: 'USD', symbol: '$', value: 0.012 },
  { currency: 'EUR', symbol: '€', value: 0.011 },
  { currency: 'GBP', symbol: '£', value: 0.81 }
];

// Sample collection data
const collections = [
  {
    name: 'new products',
    slug: 'new-products',
    description: 'Our latest and greatest products'
  },
  {
    name: 'featured products',
    slug: 'featured-products',
    description: 'Handpicked selections from our catalog'
  },
  {
    name: 'special products',
    slug: 'special-products',
    description: 'Limited time offers and special items'
  },
  {
    name: 'bestsellers',
    slug: 'bestsellers',
    description: 'Our most popular products'
  }
];

// Sample product data
const products = [
  {
    title: 'Slim Fit Cotton Shirt',
    description: 'A comfortable, lightweight cotton shirt with a modern slim fit design.',
    price: 49.99,
    discount: 10,
    is_new: true,
    is_sale: true,
    type: 'fashion',
    brand: 'Fashion Brand',
    category: 'shirts',
    stock: 100,
    images: [
      { src: 'layout-1/product/1.jpg', alt: 'Slim Fit Cotton Shirt' },
      { src: 'layout-1/product/2.jpg', alt: 'Slim Fit Cotton Shirt Back' }
    ],
    collections: ['new products', 'featured products']
  },
  {
    title: 'Casual Denim Jacket',
    description: 'Classic denim jacket with a comfortable fit and durable construction.',
    price: 89.99,
    discount: 0,
    is_new: true,
    is_sale: false,
    type: 'fashion',
    brand: 'Denim Co',
    category: 'jackets',
    stock: 75,
    images: [
      { src: 'layout-1/product/3.jpg', alt: 'Casual Denim Jacket' },
      { src: 'layout-1/product/4.jpg', alt: 'Casual Denim Jacket Side' }
    ],
    collections: ['new products', 'bestsellers']
  },
  {
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium sound quality with noise cancellation and comfortable over-ear design.',
    price: 129.99,
    discount: 15,
    is_new: false,
    is_sale: true,
    type: 'electronics',
    brand: 'AudioMax',
    category: 'headphones',
    stock: 50,
    images: [
      { src: 'layout-1/electronics/1.jpg', alt: 'Wireless Bluetooth Headphones' },
      { src: 'layout-1/electronics/2.jpg', alt: 'Wireless Bluetooth Headphones Package' }
    ],
    collections: ['special products', 'bestsellers']
  },
  {
    title: 'Smartphone X12',
    description: 'Latest generation smartphone with high-resolution display and powerful processor.',
    price: 799.99,
    discount: 5,
    is_new: true,
    is_sale: true,
    type: 'electronics',
    brand: 'TechGiant',
    category: 'smartphones',
    stock: 30,
    images: [
      { src: 'layout-1/electronics/3.jpg', alt: 'Smartphone X12' },
      { src: 'layout-1/electronics/4.jpg', alt: 'Smartphone X12 Side' }
    ],
    collections: ['new products', 'special products']
  },
  {
    title: 'Leather Office Chair',
    description: 'Ergonomic design with premium leather upholstery and adjustable height.',
    price: 199.99,
    discount: 0,
    is_new: false,
    is_sale: false,
    type: 'furniture',
    brand: 'ComfortPlus',
    category: 'chairs',
    stock: 25,
    images: [
      { src: 'layout-1/furniture/1.jpg', alt: 'Leather Office Chair' },
      { src: 'layout-1/furniture/2.jpg', alt: 'Leather Office Chair Side' }
    ],
    collections: ['featured products', 'bestsellers']
  }
];

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    console.log('Creating tables if they don\'t exist...');
    
    // Create currencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        id SERIAL PRIMARY KEY,
        currency VARCHAR(10) NOT NULL,
        symbol VARCHAR(5) NOT NULL,
        value DECIMAL(10, 4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create collections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount INTEGER DEFAULT 0,
        is_new BOOLEAN DEFAULT FALSE,
        is_sale BOOLEAN DEFAULT FALSE,
        type VARCHAR(50),
        brand VARCHAR(100),
        category VARCHAR(100),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create product_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        src VARCHAR(255) NOT NULL,
        alt VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create product_collections junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_collections (
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
        PRIMARY KEY (product_id, collection_id)
      )
    `);
    
    console.log('Tables created successfully');
    
    // Clear existing data
    await client.query('TRUNCATE currencies CASCADE');
    await client.query('TRUNCATE collections CASCADE');
    await client.query('TRUNCATE products CASCADE');
    
    console.log('Inserting currencies...');
    for (const currency of currencies) {
      await client.query(
        'INSERT INTO currencies (currency, symbol, value) VALUES ($1, $2, $3)',
        [currency.currency, currency.symbol, currency.value]
      );
    }
    
    console.log('Inserting collections...');
    for (const collection of collections) {
      await client.query(
        'INSERT INTO collections (name, slug, description) VALUES ($1, $2, $3)',
        [collection.name, collection.slug, collection.description]
      );
    }
    
    console.log('Inserting products and their relationships...');
    for (const product of products) {
      // Insert product
      const productResult = await client.query(
        `INSERT INTO products 
         (title, description, price, discount, is_new, is_sale, type, brand, category, stock) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING id`,
        [
          product.title,
          product.description,
          product.price,
          product.discount,
          product.is_new,
          product.is_sale,
          product.type,
          product.brand,
          product.category,
          product.stock
        ]
      );
      
      const productId = productResult.rows[0].id;
      
      // Insert product images
      for (const image of product.images) {
        await client.query(
          'INSERT INTO product_images (product_id, src, alt) VALUES ($1, $2, $3)',
          [productId, image.src, image.alt]
        );
      }
      
      // Link product to collections
      for (const collectionName of product.collections) {
        const collectionResult = await client.query(
          'SELECT id FROM collections WHERE name = $1',
          [collectionName]
        );
        
        if (collectionResult.rows.length > 0) {
          const collectionId = collectionResult.rows[0].id;
          await client.query(
            'INSERT INTO product_collections (product_id, collection_id) VALUES ($1, $2)',
            [productId, collectionId]
          );
        }
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the seed function
seedDatabase().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
}); 