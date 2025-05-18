import express, { Router, RequestHandler } from 'express';
import * as currencyController from '../controllers/currency.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router: Router = express.Router();

// Public routes
router.get('/', currencyController.getCurrencies as RequestHandler);

// Protected routes (admin only)
router.post('/', 
  authenticateJWT as RequestHandler, 
  authorizeRoles('admin') as RequestHandler, 
  currencyController.createCurrency as RequestHandler
);

router.put('/:id', 
  authenticateJWT as RequestHandler, 
  authorizeRoles('admin') as RequestHandler, 
  currencyController.updateCurrency as RequestHandler
);

router.delete('/:id', 
  authenticateJWT as RequestHandler, 
  authorizeRoles('admin') as RequestHandler, 
  currencyController.deleteCurrency as RequestHandler
);

export default router; 