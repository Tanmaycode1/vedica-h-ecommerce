import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add Razorpay specific fields to orders table
  await knex.schema.table('orders', (table) => {
    table.string('razorpay_order_id', 255).nullable();
    table.string('razorpay_payment_id', 255).nullable();
    table.json('payment_details').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove Razorpay specific fields from orders table
  await knex.schema.table('orders', (table) => {
    table.dropColumn('razorpay_order_id');
    table.dropColumn('razorpay_payment_id');
    table.dropColumn('payment_details');
  });
} 