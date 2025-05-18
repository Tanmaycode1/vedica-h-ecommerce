import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add SEO fields to products table
  await knex.schema.alterTable('products', (table) => {
    table.string('slug', 255).unique();
    table.string('meta_title', 255);
    table.text('meta_description');
    table.string('meta_image', 255);
    table.text('meta_keywords');
  });

  // Update existing products to set slug based on title
  const products = await knex('products').select('id', 'title');
  
  for (const product of products) {
    const slug = product.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    await knex('products')
      .where('id', product.id)
      .update({
        slug: `${slug}-${product.id}`
      });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove SEO fields from products table
  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('slug');
    table.dropColumn('meta_title');
    table.dropColumn('meta_description');
    table.dropColumn('meta_image');
    table.dropColumn('meta_keywords');
  });
} 