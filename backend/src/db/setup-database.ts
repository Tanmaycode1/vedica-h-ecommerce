import db from './db';

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');

    // Check if tables already exist
    const hasOrders = await db.schema.hasTable('orders');
    const hasPayments = await db.schema.hasTable('payments');

    // Create orders table if it doesn't exist
    if (!hasOrders) {
      console.log('Creating orders table...');
      await db.schema.createTable('orders', (table) => {
        table.increments('id').primary();
        table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.string('status', 50).notNullable().defaultTo('pending');
        table.decimal('total', 10, 2).notNullable();
        table.json('shipping_address').notNullable();
        table.json('billing_address').notNullable();
        table.string('payment_method', 50).notNullable();
        table.string('payment_status', 50).notNullable().defaultTo('pending');
        table.string('tracking_number', 100).nullable();
        table.string('razorpay_order_id', 255).nullable();
        table.string('razorpay_payment_id', 255).nullable();
        table.json('payment_details').nullable();
        table.timestamps(true, true);
      });
      console.log('Orders table created successfully');
    } else {
      console.log('Orders table already exists');
    }

    // Create order_items table if it doesn't exist
    if (!await db.schema.hasTable('order_items')) {
      console.log('Creating order_items table...');
      await db.schema.createTable('order_items', (table) => {
        table.increments('id').primary();
        table.integer('order_id').references('id').inTable('orders').onDelete('CASCADE');
        table.integer('product_id').references('id').inTable('products').nullable();
        table.integer('variant_id').references('id').inTable('product_variants').nullable();
        table.integer('quantity').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.timestamps(true, true);
      });
      console.log('Order_items table created successfully');
    } else {
      console.log('Order_items table already exists');
    }

    // Create payments table if it doesn't exist
    if (!hasPayments) {
      console.log('Creating payments table...');
      await db.schema.createTable('payments', (table) => {
        table.increments('id').primary();
        table.integer('order_id').references('id').inTable('orders').onDelete('CASCADE');
        table.string('razorpay_order_id', 255).notNullable();
        table.string('razorpay_payment_id', 255).nullable();
        table.string('razorpay_signature', 255).nullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('currency', 10).notNullable().defaultTo('INR');
        table.string('status', 50).notNullable().defaultTo('created');
        table.string('payment_method', 50).nullable();
        table.json('payment_data').nullable();
        table.string('error_code', 100).nullable();
        table.text('error_description').nullable();
        table.timestamps(true, true);
        
        // Add indexes for performance
        table.index('order_id');
        table.index('razorpay_order_id');
        table.index('razorpay_payment_id');
        table.index('status');
      });
      console.log('Payments table created successfully');
    } else {
      console.log('Payments table already exists');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the setup function
setupDatabase(); 