import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email', 100).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('first_name', 50);
    table.string('last_name', 50);
    table.string('phone', 20);
    table.string('address', 255);
    table.string('city', 50);
    table.string('state', 50);
    table.string('zip', 20);
    table.string('country', 50);
    table.string('role', 20).defaultTo('customer');
    table.boolean('is_active').defaultTo(true);
    table.string('firebase_uid', 128).nullable().unique();
    table.timestamps(true, true);
  });

  // Create collections table
  await knex.schema.createTable('collections', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('slug', 150).notNullable().unique();
    table.text('description');
    table.string('image', 255);
    table.boolean('is_featured').defaultTo(false);
    table.timestamps(true, true);
  });

  // Create products table
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('type', 50);
    table.string('brand', 100);
    table.string('category', 100);
    table.decimal('price', 10, 2).notNullable();
    table.boolean('is_new').defaultTo(false);
    table.boolean('is_sale').defaultTo(false);
    table.integer('discount').defaultTo(0);
    table.integer('stock').defaultTo(0);
    table.timestamps(true, true);
  });

  // Create product variants table
  await knex.schema.createTable('product_variants', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.string('sku', 50);
    table.string('size', 20);
    table.string('color', 50);
    table.integer('image_id').nullable();
    table.decimal('price', 10, 2).nullable();
    table.timestamps(true, true);
  });

  // Create product images table
  await knex.schema.createTable('product_images', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.integer('image_id');
    table.string('alt', 255);
    table.string('src', 255).notNullable();
    table.boolean('is_primary').defaultTo(false);
    table.timestamps(true, true);
  });

  // Create product collections table (junction table)
  await knex.schema.createTable('product_collections', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.integer('collection_id').unsigned().references('id').inTable('collections').onDelete('CASCADE');
    table.unique(['product_id', 'collection_id']);
  });

  // Create orders table
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('status', 20).defaultTo('pending');
    table.decimal('total', 10, 2).notNullable();
    table.string('shipping_method', 50);
    table.decimal('shipping_cost', 10, 2);
    table.string('payment_method', 50);
    table.string('payment_status', 20).defaultTo('pending');
    table.string('tracking_number', 100);
    table.timestamps(true, true);
  });

  // Create order items table
  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL');
    table.integer('variant_id').unsigned().references('id').inTable('product_variants').onDelete('SET NULL');
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.timestamps(true, true);
  });

  // Create currencies table
  await knex.schema.createTable('currencies', (table) => {
    table.increments('id').primary();
    table.string('currency', 3).notNullable().unique();
    table.string('symbol', 10).notNullable();
    table.decimal('value', 10, 4).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('product_collections');
  await knex.schema.dropTableIfExists('product_images');
  await knex.schema.dropTableIfExists('product_variants');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('collections');
  await knex.schema.dropTableIfExists('currencies');
  await knex.schema.dropTableIfExists('users');
} 