const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool with proper SSL configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tanmay0786',
  database: process.env.DB_NAME || 'bigdeal_ecommerce',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function populateMegaMenu() {
  const client = await pool.connect();
  
  try {
    console.log('Starting mega menu population with corrected query...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // First, clear existing mega menu items
    await client.query('DELETE FROM mega_menu_collections');
    console.log('Cleared existing mega menu items');
    
    // Get main categories (top level) - FIXED QUERY to include category_parent type
    const topLevelCategoriesResult = await client.query(`
      SELECT id, name, slug 
      FROM collections 
      WHERE collection_type = 'category_parent'
      AND level = 0
      ORDER BY name;
    `);
    
    const topLevelCategories = topLevelCategoriesResult.rows;
    console.log(`Found ${topLevelCategories.length} top-level categories`);
    
    // Add top-level categories to mega menu
    for (let i = 0; i < topLevelCategories.length; i++) {
      const category = topLevelCategories[i];
      
      // Add to mega menu as top-level item
      const result = await client.query(`
        INSERT INTO mega_menu_collections
        (collection_id, position, is_active, is_featured, parent_menu_item_id, display_subcollections, level)
        VALUES ($1, $2, TRUE, FALSE, NULL, TRUE, 0)
        RETURNING id;
      `, [category.id, i]);
      
      const menuItemId = result.rows[0].id;
      console.log(`Added ${category.name} to mega menu as top-level item with ID: ${menuItemId}`);
      
      // Get subcategories
      const subcategoriesResult = await client.query(`
        SELECT id, name, slug 
        FROM collections 
        WHERE collection_type = 'category'
        AND parent_id = $1
        ORDER BY name;
      `, [category.id]);
      
      const subcategories = subcategoriesResult.rows;
      console.log(`Found ${subcategories.length} subcategories for ${category.name}`);
      
      // Add subcategories to mega menu
      for (let j = 0; j < subcategories.length; j++) {
        const subcat = subcategories[j];
        
        // Add to mega menu as subcategory under category
        const subcatResult = await client.query(`
          INSERT INTO mega_menu_collections
          (collection_id, position, is_active, is_featured, parent_menu_item_id, display_subcollections, level)
          VALUES ($1, $2, TRUE, $3, $4, FALSE, 1)
          RETURNING id;
        `, [subcat.id, j, false, menuItemId]);
        
        const subcatMenuItemId = subcatResult.rows[0].id;
        console.log(`Added ${subcat.name} subcategory under ${category.name} with ID: ${subcatMenuItemId}`);
      }
      
      // Get brands associated with this category
      const brandsResult = await client.query(`
        SELECT id, name, slug 
        FROM collections 
        WHERE collection_type = 'brand'
        AND parent_id = $1
        ORDER BY name;
      `, [category.id]);
      
      const brands = brandsResult.rows;
      console.log(`Found ${brands.length} brands for ${category.name}`);
      
      // Add brands to mega menu
      for (let j = 0; j < brands.length; j++) {
        const brand = brands[j];
        
        // If it's one of the first 2 brands for each category, mark it as featured
        const isFeatured = j < 2;
        
        // Add to mega menu as brand under category
        const brandResult = await client.query(`
          INSERT INTO mega_menu_collections
          (collection_id, position, is_active, is_featured, parent_menu_item_id, display_subcollections, level)
          VALUES ($1, $2, TRUE, $3, $4, FALSE, 1)
          RETURNING id;
        `, [brand.id, j + subcategories.length, isFeatured, menuItemId]);
        
        const brandMenuItemId = brandResult.rows[0].id;
        console.log(`Added ${brand.name} brand under ${category.name} with ID: ${brandMenuItemId}${isFeatured ? ' (featured)' : ''}`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Mega menu population completed successfully!');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error during mega menu population:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
populateMegaMenu().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 