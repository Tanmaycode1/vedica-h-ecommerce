import express, { Router, RequestHandler } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateJWT, authenticateFirebase } from '../middleware/auth';

const router: Router = express.Router();

// Registration and login routes
router.post('/register', authController.register as RequestHandler);
router.post('/login', authController.login as RequestHandler);

// Profile route (accessible with either JWT or Firebase auth)
router.get('/profile', authenticateJWT as RequestHandler, authController.getProfile as RequestHandler);
router.get('/firebase/profile', authenticateFirebase as RequestHandler, authController.getProfile as RequestHandler);

router.put('/profile', authenticateJWT as RequestHandler, authController.updateProfile as RequestHandler);
router.put('/firebase/profile', authenticateFirebase as RequestHandler, authController.updateProfile as RequestHandler);

export default router; 