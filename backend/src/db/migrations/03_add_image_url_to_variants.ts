import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add image_url column to product_variants table
  await knex.schema.table('product_variants', (table) => {
    table.string('image_url', 255).nullable();
  });
  
  console.log('Added image_url column to product_variants table');
}

export async function down(knex: Knex): Promise<void> {
  // Remove image_url column from product_variants table
  await knex.schema.table('product_variants', (table) => {
    table.dropColumn('image_url');
  });
  
  console.log('Removed image_url column from product_variants table');
} 