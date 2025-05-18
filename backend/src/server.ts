// This file re-exports the main server from index.ts to maintain compatibility with scripts
// that expect the server to be in server.ts
import app from './index';
import authRoutes from './routes/auth.routes';
import collectionRoutes from './routes/collection.routes';
import megamenuRoutes from './routes/megamenu.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import paymentsRoutes from './routes/payments.routes';
import currencyRoutes from './routes/currency.routes';
import analyticsRoutes from './routes/analytics.routes';
import filterRoutes from './routes/filter.routes';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/megamenu', megamenuRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/filter', filterRoutes);

export default app; 