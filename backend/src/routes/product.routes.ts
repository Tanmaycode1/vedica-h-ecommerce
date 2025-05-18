import express, { Request, Response } from 'express';
import * as productController from '../controllers/product.controller';
// Comment out auth middleware imports since we're temporarily removing auth requirements
// import { authenticateJWT } from '../middleware/auth';
import db from '../db/db';

const router = express.Router();

// Debug route
router.get('/debug/ping', (req: Request, res: Response) => {
  console.log('Debug ping received with headers:', JSON.stringify(req.headers));
  res.status(200).json({ 
    message: 'Ping successful',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Test route to directly associate a product with collections
router.get('/debug/add-to-collections/:productId/:collectionIds', async (req: Request, res: Response) => {
  try {
    const { productId, collectionIds } = req.params;
    
    console.log(`[TEST] Debug add-to-collections called with productId: ${productId}, collectionIds: ${collectionIds}`);
    
    const pId = parseInt(productId, 10);
    const cIds = collectionIds.split(',').map(id => parseInt(id, 10));
    
    console.log(`[TEST] Interpreted as: product=${pId}, collections=[${cIds.join(', ')}]`);
    
    // First check if product exists
    const product = await db('products').where('id', pId).first();
    if (!product) {
      console.log(`[TEST] Product not found: ${pId}`);
      return res.status(404).json({ 
        message: 'Product not found',
        product_id: pId
      });
    }
    
    console.log(`[TEST] Found product: ${product.title}`);
    
    // Check which collections exist
    const existingCollections = await db('collections')
      .whereIn('id', cIds)
      .select('id', 'name');
    
    const validCollectionIds = existingCollections.map((c: any) => c.id);
    console.log(`[TEST] Valid collection IDs: ${validCollectionIds.join(', ') || 'none'}`);
    
    if (validCollectionIds.length === 0) {
      console.log(`[TEST] No valid collections found`);
      return res.status(404).json({ 
        message: 'No valid collections found',
        requested_collections: cIds
      });
    }
    
    // First delete all existing associations
    console.log(`[TEST] Deleting existing associations for product ${pId}`);
    await db('product_collections').where('product_id', pId).del();
    console.log(`[TEST] Successfully deleted existing associations`);
    
    // Add the new associations
    const newAssociations = validCollectionIds.map((collectionId: number) => ({
      product_id: pId,
      collection_id: collectionId
    }));
    
    console.log(`[TEST] Adding ${newAssociations.length} new associations`);
    const insertResult = await db('product_collections').insert(newAssociations);
    console.log(`[TEST] Insert result:`, insertResult);
    
    // Get all current associations after update
    const currentAssociations = await db('product_collections')
      .where('product_id', pId)
      .join('collections', 'product_collections.collection_id', 'collections.id')
      .select('collections.id', 'collections.name');
    
    console.log(`[TEST] Final product associations:`, currentAssociations.map((c: any) => `${c.id}:${c.name}`).join(', ') || 'none');
    
    return res.status(200).json({
      message: 'Product successfully associated with collections',
      product_id: pId,
      added_collections: validCollectionIds,
      all_collections: currentAssociations.map((c: any) => ({ id: c.id, name: c.name }))
    });
  } catch (error: any) {
    console.error('[TEST] Error in test route:', error);
    return res.status(500).json({
      message: 'Error associating product with collections',
      error: error.message
    });
  }
});

// Public routes
router.get('/', productController.getProducts);
router.get('/categories', productController.getProductCategories);
router.get('/brands', productController.getProductBrands);
router.get('/colors', productController.getProductColors);
router.get('/:id', productController.getProductById);

// Make these public for now (remove auth requirements)
router.post('/', productController.createProduct);
router.post('/:id/variants', productController.addVariants);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Update product collections
router.put('/:id/collections', productController.updateProductCollections);

export default router;