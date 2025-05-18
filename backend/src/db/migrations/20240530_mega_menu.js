/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if table already exists
  const exists = await knex.schema.hasTable('mega_menu_collections');
  
  if (!exists) {
    console.log('Creating mega_menu_collections table...');
    await knex.schema.createTable('mega_menu_collections', (table) => {
      table.increments('id').primary();
      table.integer('collection_id').notNullable().references('id').inTable('collections').onDelete('CASCADE');
      table.integer('position').notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Add unique constraint to prevent duplicate entries
      table.unique(['collection_id']);
    });
    console.log('mega_menu_collections table created successfully');
  } else {
    console.log('mega_menu_collections table already exists');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop the table
  return knex.schema.dropTableIfExists('mega_menu_collections');
}; 