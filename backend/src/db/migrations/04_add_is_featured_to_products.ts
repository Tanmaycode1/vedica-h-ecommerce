import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('products', table => {
    table.boolean('is_featured').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('products', table => {
    table.dropColumn('is_featured');
  });
} 