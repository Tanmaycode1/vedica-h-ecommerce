import db from './db';

/**
 * Ensures the product_variants table has an image_url column
 * This is a workaround to avoid running migrations when database access is limited
 */
export async function ensureVariantImageUrlColumn(): Promise<void> {
  try {
    // Check if the column exists already
    const hasColumn = await db.schema.hasColumn('product_variants', 'image_url');
    
    if (!hasColumn) {
      console.log('Adding image_url column to product_variants table...');
      
      // Add the column
      await db.schema.table('product_variants', (table) => {
        table.string('image_url', 255).nullable();
      });
      
      console.log('Successfully added image_url column to product_variants table.');
      
      // Now populate image_url fields for existing variants
      try {
        console.log('Populating image_url for existing variants...');
        
        // Get variants with image_id
        const variants = await db('product_variants')
          .whereNotNull('image_id')
          .select('id', 'product_id', 'image_id');
        
        console.log(`Found ${variants.length} variants with image_id`);
        
        // For each variant, find the corresponding image and update image_url
        let updatedCount = 0;
        
        for (const variant of variants) {
          try {
            // Get the product image that matches the image_id
            const image = await db('product_images')
              .where('id', variant.image_id)
              .first();
            
            if (image) {
              // Format the image URL
              let imageUrl = image.src;
              
              // Add /uploads prefix if needed
              if (imageUrl && imageUrl.startsWith('/product-images/')) {
                imageUrl = `/uploads${imageUrl}`;
              }
              
              // Update the variant with the image URL
              await db('product_variants')
                .where('id', variant.id)
                .update({
                  image_url: imageUrl,
                  updated_at: new Date()
                });
              
              updatedCount++;
            }
          } catch (variantError) {
            console.error(`Error updating variant ${variant.id}:`, variantError);
          }
        }
        
        console.log(`Successfully populated image_url for ${updatedCount} variants.`);
      } catch (populateError) {
        console.error('Error populating image_url values:', populateError);
      }
    } else {
      console.log('image_url column already exists in product_variants table.');
    }
  } catch (error) {
    console.error('Error ensuring image_url column exists:', error);
  }
}

export default ensureVariantImageUrlColumn; 