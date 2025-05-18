import db from '../db';

/**
 * Updates the mega_menu_collections table to support hierarchical subcollections
 */
export async function updateMegaMenuForSubcollections(): Promise<void> {
  try {
    // Start a transaction
    await db.transaction(async (trx) => {
      console.log('Starting update to support subcollections in mega menu...');

      // 1. Drop the unique constraint on collection_id to allow multiple parent-child entries
      const uniqueConstraintExists = await trx.raw(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'mega_menu_collections'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%collection_id%'
      `);

      if (uniqueConstraintExists.rows.length > 0) {
        const constraintName = uniqueConstraintExists.rows[0].constraint_name;
        console.log(`Dropping unique constraint ${constraintName} on mega_menu_collections table...`);
        
        await trx.raw(`ALTER TABLE mega_menu_collections DROP CONSTRAINT "${constraintName}"`);
        console.log('Unique constraint dropped successfully');
      } else {
        console.log('No unique constraint on collection_id found');
      }

      // 2. Add parent_menu_item_id column to track parent-child relationship in the menu
      const hasParentMenuItemId = await trx.schema.hasColumn('mega_menu_collections', 'parent_menu_item_id');
      
      if (!hasParentMenuItemId) {
        console.log('Adding parent_menu_item_id column to mega_menu_collections table...');
        
        await trx.schema.alterTable('mega_menu_collections', (table) => {
          // Add parent_menu_item_id as self-referencing foreign key
          table.integer('parent_menu_item_id')
            .nullable()
            .references('id')
            .inTable('mega_menu_collections')
            .onDelete('CASCADE');
          
          // Add display_subcollections flag to determine if children should be displayed
          table.boolean('display_subcollections')
            .notNullable()
            .defaultTo(false);
          
          // Add level for tracking hierarchy depth in the menu
          table.integer('level')
            .notNullable()
            .defaultTo(0);
        });
        
        console.log('Added parent_menu_item_id and related columns to mega_menu_collections table');
      }

      // 3. Update existing mega menu entries to set level = 0 (top level)
      await trx('mega_menu_collections')
        .update({ level: 0 })
        .whereNull('parent_menu_item_id');
      
      console.log('Updated existing mega menu items to level 0');

      // 4. Add a composite unique constraint to prevent duplicate entries of the same collection
      // within the same parent menu item
      const hasNewUniqueConstraint = await trx.raw(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'mega_menu_collections'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%parent_collection%'
      `);

      if (hasNewUniqueConstraint.rows.length === 0) {
        console.log('Adding new unique constraint for collection_id + parent_menu_item_id...');
        
        await trx.raw(`
          ALTER TABLE mega_menu_collections 
          ADD CONSTRAINT unique_collection_per_parent 
          UNIQUE (collection_id, parent_menu_item_id)
        `);
        
        console.log('New unique constraint added successfully');
      }

      console.log('Update to support subcollections in mega menu completed successfully!');
    });
  } catch (error) {
    console.error('Error during mega menu subcollections update:', error);
    throw error;
  }
}

export default updateMegaMenuForSubcollections; 