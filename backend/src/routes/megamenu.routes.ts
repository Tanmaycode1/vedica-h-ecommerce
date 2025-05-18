import express, { Router, RequestHandler } from 'express';
import * as megaMenuController from '../controllers/megamenu.controller';
// Comment out auth middleware imports since we're temporarily removing auth requirements
// import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router: Router = express.Router();

// Public routes
router.get('/tree', megaMenuController.getMegaMenuTree as RequestHandler);
router.get('/', megaMenuController.getMegaMenu as RequestHandler);

// Admin routes - make these public for now (remove auth requirements)
router.post('/', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  megaMenuController.addToMegaMenu as RequestHandler
);

// Add subcollection to a menu item
router.post('/subcollection', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  megaMenuController.addSubcollectionToMegaMenu as RequestHandler
);

router.put('/:id', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  megaMenuController.updateMegaMenuItem as RequestHandler
);

router.delete('/:id', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  megaMenuController.removeFromMegaMenu as RequestHandler
);

router.post('/reorder', 
  // authenticateJWT as RequestHandler, 
  // authorizeRoles('admin') as RequestHandler, 
  megaMenuController.reorderMegaMenu as RequestHandler
);

export default router; 