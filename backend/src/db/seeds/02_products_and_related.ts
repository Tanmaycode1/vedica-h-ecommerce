import { Knex } from 'knex';
import { 
  generateRandomProducts, 
  generateProductVariants, 
  generateProductImages, 
  generateCollections
} from '../../utils/seedHelpers';
import { ProductCollection } from '../../models/Product';

export async function seed(knex: Knex): Promise<void> {
  try {
    // Deletes ALL existing entries
    await knex('product_collections').del();
    await knex('product_images').del();
    await knex('product_variants').del();
    await knex('collections').del();
    await knex('products').del();

    // Generate 50 random products
    const productCount = 50;
    const products = generateRandomProducts(productCount);
    
    // Insert products and get the IDs
    const insertedProductIds: number[] = [];
    for (const product of products) {
      const result = await knex('products').insert(product).returning('id');
      const productId = typeof result[0] === 'object' ? result[0].id : result[0];
      insertedProductIds.push(productId);
    }
    
    console.log(`Successfully inserted ${insertedProductIds.length} products with IDs:`, insertedProductIds);
    
    // Insert collections
    const collections = generateCollections();
    const collectionResults = await knex('collections').insert(collections).returning('id');
    const insertedCollectionIds: number[] = collectionResults.map(result => 
      typeof result === 'object' ? result.id : result
    );
    
    console.log(`Successfully inserted ${insertedCollectionIds.length} collections`);
    
    // For each product, generate and insert variants and images
    for (let i = 0; i < insertedProductIds.length; i++) {
      const productId = insertedProductIds[i];
      
      // Generate variants and images with the actual product ID
      const variants = generateProductVariants(productId);
      const images = generateProductImages(productId);
      
      await knex('product_variants').insert(variants);
      await knex('product_images').insert(images);
      
      console.log(`Successfully inserted variants and images for product ID ${productId}`);
    }
    
    // Generate and insert product-collection relationships with actual IDs
    const productCollections: ProductCollection[] = [];
    for (const productId of insertedProductIds) {
      // Assign each product to 1-3 random collections from the actual collection IDs
      const collectionCount = Math.floor(Math.random() * 3) + 1;
      const collections = new Set<number>();
      
      while (collections.size < collectionCount && collections.size < insertedCollectionIds.length) {
        const randomIndex = Math.floor(Math.random() * insertedCollectionIds.length);
        collections.add(insertedCollectionIds[randomIndex]);
      }
      
      collections.forEach(collectionId => {
        productCollections.push({
          product_id: productId,
          collection_id: collectionId
        });
      });
    }
    
    await knex('product_collections').insert(productCollections);
    console.log(`Successfully inserted ${productCollections.length} product-collection relationships`);
    
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error in seed file:', error);
    throw error;
  }
} 