import express, { Router, RequestHandler } from 'express';
import * as collectionController from '../controllers/collection.controller';
// Comment out auth middleware imports since we're temporarily removing auth requirements
// import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router: Router = express.Router();

// Debug route
router.get('/debug/ping', (req, res) => {
  console.log('Collection debug ping received with headers:', JSON.stringify(req.headers));
  res.status(200).json({ 
    message: 'Collection ping successful',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Public routes
router.get('/', collectionController.getCollections as RequestHandler);
router.get('/tree', collectionController.getCollectionsTree as RequestHandler);
router.get('/:slug', collectionController.getCollectionBySlug as RequestHandler);
router.get('/by-slug/:slug', collectionController.getCollectionBySlug as RequestHandler);
router.get('/featured-brands', collectionController.getFeaturedBrands as RequestHandler);

// Make these public for now (remove auth requirements)
router.post('/', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  collectionController.createCollection as RequestHandler
);

router.put('/:id', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  collectionController.updateCollection as RequestHandler
);

router.patch('/:id/toggle-featured', collectionController.toggleBrandFeatured as RequestHandler);

router.delete('/:id', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  collectionController.deleteCollection as RequestHandler
);

// Routes for managing products in collections
router.post('/:id/products', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  collectionController.addProductToCollection as RequestHandler
);

// Add multiple products in one request
router.post('/:id/products/batch', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  collectionController.addProductsToCollection as RequestHandler
);

router.delete('/:id/products/:productId', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  collectionController.removeProductFromCollection as RequestHandler
);

export default router; 