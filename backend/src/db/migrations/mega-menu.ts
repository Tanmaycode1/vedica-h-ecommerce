import db from '../db';

export async function createMegaMenuTable(): Promise<void> {
  try {
    // Check if table already exists
    const exists = await db.schema.hasTable('mega_menu_collections');
    
    if (!exists) {
      console.log('Creating mega_menu_collections table...');
      await db.schema.createTable('mega_menu_collections', (table) => {
        table.increments('id').primary();
        table.integer('collection_id').notNullable().references('id').inTable('collections').onDelete('CASCADE');
        table.integer('position').notNullable().defaultTo(0);
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        // Add unique constraint to prevent duplicate entries
        table.unique(['collection_id']);
      });
      console.log('mega_menu_collections table created successfully');
    } else {
      console.log('mega_menu_collections table already exists');
    }
  } catch (error) {
    console.error('Error creating mega_menu_collections table:', error);
    throw error;
  }
}

export default createMegaMenuTable; 