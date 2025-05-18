import express, { Router, RequestHandler } from 'express';
import * as uploadController from '../controllers/upload.controller';
// Comment out auth middleware imports since we're temporarily removing auth requirements
// import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import upload from '../utils/fileUpload';

const router: Router = express.Router();

// Make these public for testing purposes
router.post(
  '/products/:productId/images',
  // authenticateJWT as RequestHandler,
  // authorizeRoles('admin') as RequestHandler,
  upload.single('image'),
  uploadController.uploadProductImage as RequestHandler
);

// Delete product image
router.delete(
  '/products/images/:id',
  // authenticateJWT as RequestHandler,
  // authorizeRoles('admin') as RequestHandler,
  uploadController.deleteProductImage as RequestHandler
);

// Collection image upload route
router.post(
  '/collections/:collectionId/images',
  // authenticateJWT as RequestHandler,
  // authorizeRoles('admin') as RequestHandler,
  upload.single('image'),
  uploadController.uploadCollectionImage as RequestHandler
);

// Delete collection image
router.delete(
  '/collections/images/:id',
  // authenticateJWT as RequestHandler,
  // authorizeRoles('admin') as RequestHandler,
  uploadController.deleteCollectionImage as RequestHandler
);

export default router; 