import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('collections', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.string('description').nullable();
    table.timestamps(true, true);
  });

  return knex.schema.createTable('product_collections', (table) => {
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.integer('collection_id').unsigned().references('id').inTable('collections').onDelete('CASCADE');
    table.primary(['product_id', 'collection_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_collections');
  return knex.schema.dropTableIfExists('collections');
} 