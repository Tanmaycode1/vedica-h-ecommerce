import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import ensureVariantImageUrlColumn from './db/setup-variant-image-url';

// Import routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import collectionRoutes from './routes/collection.routes';
import uploadRoutes from './routes/upload.routes';
import currencyRoutes from './routes/currency.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import paymentsRoutes from './routes/payments.routes';
import megaMenuRoutes from './routes/megamenu.routes';
import analyticsRoutes from './routes/analytics.routes';
import filterRoutes from './routes/filter.routes';

// Load environment variables
dotenv.config();

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
const uploadsDirPath = path.join(__dirname, '..', uploadsDir);
const productImagesDir = path.join(uploadsDirPath, 'product-images');
const collectionImagesDir = path.join(uploadsDirPath, 'collection-images');

// Check if uploads directory exists, if not create it
if (!fs.existsSync(uploadsDirPath)) {
  console.log(`Creating uploads directory: ${uploadsDirPath}`);
  fs.mkdirSync(uploadsDirPath, { recursive: true });
}

// Check if product-images directory exists, if not create it
if (!fs.existsSync(productImagesDir)) {
  console.log(`Creating product-images directory: ${productImagesDir}`);
  fs.mkdirSync(productImagesDir, { recursive: true });
}

// Check if collection-images directory exists, if not create it
if (!fs.existsSync(collectionImagesDir)) {
  console.log(`Creating collection-images directory: ${collectionImagesDir}`);
  fs.mkdirSync(collectionImagesDir, { recursive: true });
}

// Initialize express app
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files - Updated to ensure correct path handling
app.use('/uploads', express.static(path.join(__dirname, '..', uploadsDir)));

// Make sure root-level product-images URLs also work for backward compatibility
app.use('/product-images', express.static(path.join(__dirname, '..', uploadsDir, 'product-images')));

// Add direct route for collection-images
app.use('/collection-images', express.static(path.join(__dirname, '..', uploadsDir, 'collection-images')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/megamenu', megaMenuRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/filter', filterRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API is available at http://localhost:${PORT}/api`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  
  // Ensure variant image_url column exists in database
  try {
    await ensureVariantImageUrlColumn();
  } catch (error) {
    console.error('Failed to set up variant image_url column:', error);
  }
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose a different port.`);
    console.error(`You can set a different port using the PORT environment variable.`);
    process.exit(1);
  } else {
    console.error('Error starting server:', err);
    process.exit(1);
  }
});

export default app; 