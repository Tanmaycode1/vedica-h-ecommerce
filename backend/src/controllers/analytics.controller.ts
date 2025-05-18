import { Request, Response } from 'express';
import db from '../db/db';

/**
 * Get dashboard analytics data including counts and aggregated statistics
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get order statistics
    const orderStats = await getOrderStats();
    
    // Get payment statistics
    const paymentStats = await getPaymentStats();
    
    // Get product statistics
    const productStats = await getProductStats();
    
    // Get collection statistics
    const collectionStats = await getCollectionStats();
    
    // Get revenue statistics
    const revenueStats = await getRevenueStats();
    
    // Compile all statistics
    const dashboardStats = {
      orders: orderStats,
      payments: paymentStats,
      products: productStats,
      collections: collectionStats,
      revenue: revenueStats
    };
    
    res.status(200).json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch analytics data' });
  }
};

/**
 * Get order statistics
 */
const getOrderStats = async () => {
  // Get total count of orders
  const [totalCountResult] = await db('orders').count('id as count');
  const totalCount = parseInt(totalCountResult.count as string);
  
  // Get count by status
  const statusCounts = await db('orders')
    .select('status')
    .count('id as count')
    .groupBy('status');
  
  // Get recent orders (last 5)
  const recentOrders = await db('orders')
    .join('users', 'orders.user_id', 'users.id')
    .select(
      'orders.id',
      'orders.status',
      'orders.total',
      'orders.payment_method',
      'orders.payment_status',
      'orders.created_at',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('orders.created_at', 'desc')
    .limit(5);
  
  // Get counts for last 7 days and previous 7 days
  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(now.getDate() - 7);
  
  const previous7Days = new Date(last7Days);
  previous7Days.setDate(last7Days.getDate() - 7);
  
  const [last7DaysResult] = await db('orders')
    .where('created_at', '>=', last7Days.toISOString())
    .count('id as count');
  
  const [previous7DaysResult] = await db('orders')
    .where('created_at', '>=', previous7Days.toISOString())
    .where('created_at', '<', last7Days.toISOString())
    .count('id as count');
  
  const last7DaysCount = parseInt(last7DaysResult.count as string);
  const previous7DaysCount = parseInt(previous7DaysResult.count as string);
  
  // Calculate trend percentage
  let trendPercentage = 0;
  if (previous7DaysCount > 0) {
    trendPercentage = ((last7DaysCount - previous7DaysCount) / previous7DaysCount) * 100;
  } else if (last7DaysCount > 0) {
    trendPercentage = 100; // If there were no orders in the previous period but there are now
  }
  
  return {
    total: totalCount,
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count as string);
      return acc;
    }, {} as Record<string, number>),
    recentOrders,
    trend: {
      last7Days: last7DaysCount,
      previous7Days: previous7DaysCount,
      percentage: trendPercentage
    }
  };
};

/**
 * Get payment statistics
 */
const getPaymentStats = async () => {
  // Get total count of payments
  const [totalCountResult] = await db('payments').count('id as count');
  const totalCount = parseInt(totalCountResult.count as string);
  
  // Get count by status
  const statusCounts = await db('payments')
    .select('status')
    .count('id as count')
    .groupBy('status');
    
  // Get recent payments (last 5)
  const recentPayments = await db('payments')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(5);
  
  // Get payment methods from orders
  const paymentMethods = await db('orders')
    .select('payment_method')
    .count('id as count')
    .groupBy('payment_method');
  
  return {
    total: totalCount,
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count as string);
      return acc;
    }, {} as Record<string, number>),
    byMethod: paymentMethods.reduce((acc, item) => {
      acc[item.payment_method] = parseInt(item.count as string);
      return acc;
    }, {} as Record<string, number>),
    recentPayments
  };
};

/**
 * Get product statistics
 */
const getProductStats = async () => {
  // Get total count of products
  const [totalCountResult] = await db('products').count('id as count');
  const totalCount = parseInt(totalCountResult.count as string);
  
  // Get count by category
  const categoryCounts = await db('products')
    .select('category')
    .count('id as count')
    .groupBy('category');
  
  // Get count by brand
  const brandCounts = await db('products')
    .select('brand')
    .count('id as brand_count')
    .whereNotNull('brand')
    .groupBy('brand')
    .orderBy('brand_count', 'desc')
    .limit(10);
  
  return {
    total: totalCount,
    byCategory: categoryCounts.reduce((acc, item) => {
      const category = item.category || 'uncategorized';
      acc[category] = parseInt(item.count as string);
      return acc;
    }, {} as Record<string, number>),
    topBrands: brandCounts.reduce((acc, item) => {
      acc[item.brand] = parseInt(item.brand_count as string);
      return acc;
    }, {} as Record<string, number>)
  };
};

/**
 * Get collection statistics
 */
const getCollectionStats = async () => {
  // Get total count of collections
  const [totalCountResult] = await db('collections').count('id as count');
  const totalCount = parseInt(totalCountResult.count as string);
  
  // Get count by collection type
  const typeCounts = await db('collections')
    .select('collection_type')
    .count('id as count')
    .groupBy('collection_type');
  
  // Get top collections by product count
  const topCollections = await db('collections as c')
    .leftJoin('product_collections as pc', 'c.id', 'pc.collection_id')
    .select('c.id', 'c.name', 'c.slug', 'c.collection_type')
    .count('pc.product_id as product_count')
    .groupBy('c.id', 'c.name', 'c.slug', 'c.collection_type')
    .orderBy('product_count', 'desc')
    .limit(5);
  
  return {
    total: totalCount,
    byType: typeCounts.reduce((acc, item) => {
      const type = item.collection_type || 'uncategorized';
      acc[type] = parseInt(item.count as string);
      return acc;
    }, {} as Record<string, number>),
    topCollections
  };
};

/**
 * Get revenue statistics
 */
const getRevenueStats = async () => {
  // Calculate total revenue from successful payments
  const [totalRevenueResult] = await db('payments')
    .where('status', 'captured')
    .sum('amount as total');
  
  const totalRevenue = parseFloat(totalRevenueResult.total as string) || 0;
  
  // Get monthly revenue for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyRevenue = await db('payments')
    .where('status', 'captured')
    .where('created_at', '>=', sixMonthsAgo.toISOString())
    .select(db.raw('DATE_TRUNC(\'month\', created_at) as month'))
    .sum('amount as total')
    .groupBy('month')
    .orderBy('month', 'asc');
  
  // Calculate average order value
  const [avgOrderValueResult] = await db('orders')
    .avg('total as average');
  
  const avgOrderValue = parseFloat(avgOrderValueResult.average as string) || 0;
  
  return {
    total: totalRevenue,
    avgOrderValue,
    byMonth: monthlyRevenue.map(item => ({
      month: item.month,
      total: parseFloat(item.total as string) || 0
    }))
  };
}; 