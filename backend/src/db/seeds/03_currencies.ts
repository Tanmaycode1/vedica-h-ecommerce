import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('currencies').del();

  // Insert seed currencies
  await knex('currencies').insert([
    { currency: 'USD', symbol: '$', value: 1.0, created_at: new Date(), updated_at: new Date() },
    { currency: 'EUR', symbol: '€', value: 0.92, created_at: new Date(), updated_at: new Date() },
    { currency: 'GBP', symbol: '£', value: 0.81, created_at: new Date(), updated_at: new Date() },
    { currency: 'INR', symbol: '₹', value: 83.02, created_at: new Date(), updated_at: new Date() },
    { currency: 'AUD', symbol: 'A$', value: 1.52, created_at: new Date(), updated_at: new Date() }
  ]);
} 