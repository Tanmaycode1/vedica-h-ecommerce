import express, { RequestHandler } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// Public routes
// Create payment order for an existing order
router.post('/orders/:orderId', paymentController.createPaymentOrder as RequestHandler);
// Handle webhook
router.post('/webhook', paymentController.handlePaymentFailure as RequestHandler);

// Private routes (require authentication)
router.use(authenticateJWT as RequestHandler);

// Verify payment
router.post('/verify', paymentController.verifyPayment as RequestHandler);

// Get payment details for an order
router.get('/orders/:orderId', paymentController.getPaymentByOrderId as RequestHandler);

// Admin routes - properly secured with role-based authorization
router.get('/admin/all', 
  authorizeRoles('admin') as RequestHandler, 
  paymentController.getAllPayments as RequestHandler
);

export default router; 