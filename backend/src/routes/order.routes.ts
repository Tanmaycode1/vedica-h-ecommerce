import { Router, Request, Response, NextFunction } from 'express';
import { 
  getOrdersByUser, 
  getOrderById, 
  createOrder, 
  updateOrderStatus,
  getAllOrders
} from '../controllers/order.controller';
import { authenticateFirebase, authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Create a combined authentication middleware that tries Firebase first for user-facing routes
// and JWT first for admin routes
const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  // Try Firebase authentication first for user-facing functionality
  authenticateFirebase(req, res, (err?: any) => {
    if (req.user) {
      // Firebase authentication successful
      return next();
    }
    
    // If Firebase fails, try JWT authentication as fallback
    authenticateJWT(req, res, next);
  });
};

// Create a combined authentication middleware that tries JWT first for admin panel
const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Try JWT authentication first for admin panel
  authenticateJWT(req, res, (err?: any) => {
    if (req.user) {
      // JWT authentication successful
      return next();
    }
    
    // If JWT fails, try Firebase authentication (for admin users via Firebase)
    authenticateFirebase(req, res, next);
  });
};

// User-facing routes - prioritize Firebase auth
router.get('/', authenticateUser, getOrdersByUser);
router.get('/:id', authenticateUser, getOrderById);
router.post('/', authenticateUser, createOrder);
router.put('/:id', authenticateUser, updateOrderStatus);
router.patch('/:id', authenticateUser, updateOrderStatus);

// Admin routes - prioritize JWT auth
router.get('/admin/all', authenticateAdmin, authorizeRoles('admin'), getAllOrders);

export default router; 