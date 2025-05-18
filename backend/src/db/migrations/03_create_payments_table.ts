import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create payments table to track Razorpay payments
  await knex.schema.createTable('payments', (table) => {
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
}

export async function down(knex: Knex): Promise<void> {
  // Drop payments table
  await knex.schema.dropTableIfExists('payments');
} 