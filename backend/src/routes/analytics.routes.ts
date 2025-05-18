import express, { RequestHandler } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// Analytics routes are protected and only accessible by admin users
router.use(authenticateJWT as RequestHandler);
router.use(authorizeRoles('admin') as RequestHandler);

// Dashboard analytics
router.get('/dashboard', analyticsController.getDashboardStats as RequestHandler);

export default router; 