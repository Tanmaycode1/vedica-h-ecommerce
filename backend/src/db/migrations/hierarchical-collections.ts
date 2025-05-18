import db from '../db';

/**
 * Adds parent_id column to collections table and modifies product schema to remove brands
 */
export async function migrateToHierarchicalCollections(): Promise<void> {
  try {
    // Start a transaction
    await db.transaction(async (trx) => {
      console.log('Starting migration to hierarchical collections...');

      // 1. Add parent_id to collections table if it doesn't exist
      const hasParentIdColumn = await trx.schema.hasColumn('collections', 'parent_id');
      if (!hasParentIdColumn) {
        console.log('Adding parent_id column to collections table...');
        await trx.schema.alterTable('collections', (table) => {
          // Add parent_id as a foreign key to the same table
          table.integer('parent_id').nullable().references('id').inTable('collections').onDelete('SET NULL');
          // Add a type column for collection categorization (brand, category, etc.)
          table.string('collection_type', 50).nullable();
          // Add a level column to track the depth in hierarchy
          table.integer('level').defaultTo(0);
          // Add is_active flag
          table.boolean('is_active').defaultTo(true);
          // Add image URL for collection
          table.string('image_url', 255).nullable();
        });
        console.log('Added parent_id and related columns to collections table.');
      }

      // 2. Create collections for existing brands
      // First, check if brands exist in products table
      const brands = await trx('products')
        .distinct('brand')
        .whereNotNull('brand')
        .orderBy('brand');

      if (brands.length > 0) {
        console.log(`Found ${brands.length} distinct brands to migrate to collections...`);

        // Create a "Brands" parent collection if it doesn't exist
        let brandsCollectionId;
        const brandsCollection = await trx('collections')
          .where({ name: 'Brands', collection_type: 'brand_parent' })
          .first();

        if (!brandsCollection) {
          const result = await trx('collections')
            .insert({
              name: 'Brands',
              slug: 'brands',
              description: 'All product brands',
              collection_type: 'brand_parent',
              level: 0,
              created_at: new Date(),
              updated_at: new Date()
            })
            .returning('id');
          
          brandsCollectionId = result[0].id || result[0]; // Handle both object and primitive return types
          console.log(`Created parent "Brands" collection with ID: ${brandsCollectionId}`);
        } else {
          brandsCollectionId = brandsCollection.id;
          console.log(`Using existing "Brands" collection with ID: ${brandsCollectionId}`);
        }

        // Create collection entries for each brand
        for (const brand of brands) {
          if (!brand.brand) continue; // Skip null/empty brands

          // Create slug from brand name
          const slug = brand.brand
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          // Check if brand collection already exists
          const existingBrandCollection = await trx('collections')
            .where({ 
              name: brand.brand,
              collection_type: 'brand'
            })
            .first();

          if (!existingBrandCollection) {
            // Create new collection for this brand
            const result = await trx('collections')
              .insert({
                name: brand.brand,
                slug: slug,
                description: `Products from ${brand.brand}`,
                parent_id: brandsCollectionId,
                collection_type: 'brand',
                level: 1,
                created_at: new Date(),
                updated_at: new Date()
              })
              .returning('id');
            
            const brandCollectionId = result[0].id || result[0]; // Handle both object and primitive return types
            console.log(`Created collection for brand "${brand.brand}" with ID: ${brandCollectionId}`);

            // Add all products with this brand to the brand collection
            const products = await trx('products')
              .select('id')
              .where('brand', brand.brand);

            if (products.length > 0) {
              // Create product_collections entries
              const productCollections = products.map(product => ({
                product_id: product.id,
                collection_id: brandCollectionId
              }));

              await trx('product_collections').insert(productCollections);
              console.log(`Added ${products.length} products to brand collection "${brand.brand}"`);
            }
          } else {
            console.log(`Collection for brand "${brand.brand}" already exists with ID: ${existingBrandCollection.id}`);
          }
        }
      }

      // 3. Similar migration for categories
      const categories = await trx('products')
        .distinct('category')
        .whereNotNull('category')
        .orderBy('category');

      if (categories.length > 0) {
        console.log(`Found ${categories.length} distinct categories to migrate to collections...`);

        // Create a "Categories" parent collection if it doesn't exist
        let categoriesCollectionId;
        const categoriesCollection = await trx('collections')
          .where({ name: 'Categories', collection_type: 'category_parent' })
          .first();

        if (!categoriesCollection) {
          const result = await trx('collections')
            .insert({
              name: 'Categories',
              slug: 'categories',
              description: 'All product categories',
              collection_type: 'category_parent',
              level: 0,
              created_at: new Date(),
              updated_at: new Date()
            })
            .returning('id');
          
          categoriesCollectionId = result[0].id || result[0]; // Handle both object and primitive return types
          console.log(`Created parent "Categories" collection with ID: ${categoriesCollectionId}`);
        } else {
          categoriesCollectionId = categoriesCollection.id;
          console.log(`Using existing "Categories" collection with ID: ${categoriesCollectionId}`);
        }

        // Create collection entries for each category
        for (const category of categories) {
          if (!category.category) continue; // Skip null/empty categories

          // Create slug from category name
          const slug = category.category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          // Check if category collection already exists
          const existingCategoryCollection = await trx('collections')
            .where({ 
              name: category.category,
              collection_type: 'category'
            })
            .first();

          if (!existingCategoryCollection) {
            // Create new collection for this category
            const result = await trx('collections')
              .insert({
                name: category.category,
                slug: slug,
                description: `Products in ${category.category}`,
                parent_id: categoriesCollectionId,
                collection_type: 'category',
                level: 1,
                created_at: new Date(),
                updated_at: new Date()
              })
              .returning('id');
            
            const categoryCollectionId = result[0].id || result[0]; // Handle both object and primitive return types
            console.log(`Created collection for category "${category.category}" with ID: ${categoryCollectionId}`);

            // Add all products with this category to the category collection
            const products = await trx('products')
              .select('id')
              .where('category', category.category);

            if (products.length > 0) {
              // Create product_collections entries
              const productCollections = products.map(product => ({
                product_id: product.id,
                collection_id: categoryCollectionId
              }));

              await trx('product_collections').insert(productCollections);
              console.log(`Added ${products.length} products to category collection "${category.category}"`);
            }
          } else {
            console.log(`Collection for category "${category.category}" already exists with ID: ${existingCategoryCollection.id}`);
          }
        }
      }

      console.log('Migration to hierarchical collections completed successfully!');
    });
  } catch (error) {
    console.error('Error during hierarchical collections migration:', error);
    throw error;
  }
}

export default migrateToHierarchicalCollections; 