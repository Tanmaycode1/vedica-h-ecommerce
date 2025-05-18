'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const STATUS_COLORS = {
  pending: '#FFBB28',
  processing: '#0088FE',
  completed: '#00C49F',
  cancelled: '#FF8042',
  shipped: '#8884d8',
  delivered: '#82ca9d',
  paid: '#00C49F',
  failed: '#FF8042'
};

const orderStatusColors = {
  pending: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
};

interface Collection {
  id: number;
  name: string;
  slug: string;
  collection_type?: string;
  product_count?: string | number;
}

const stats = [
  { name: 'Total Products', stat: '0', change: '+4.75%', changeType: 'positive' },
  { name: 'Active Orders', stat: '3', change: '+1.2%', changeType: 'positive' },
  { name: 'Total Revenue', stat: '$0.00', change: '-3.2%', changeType: 'negative' },
  { name: 'Avg. Order Value', stat: '$0.00', change: '+2.5%', changeType: 'positive' },
];

const salesData = [
  { name: 'Mon', value: 1200 },
  { name: 'Tue', value: 900 },
  { name: 'Wed', value: 1500 },
  { name: 'Thu', value: 1800 },
  { name: 'Fri', value: 1000 },
  { name: 'Sat', value: 1400 },
  { name: 'Sun', value: 1700 },
];

const topProducts = [
  { id: 1, name: 'Smartphone X', category: 'Electronics', sales: 45, revenue: 32547.50 },
  { id: 2, name: 'Wireless Earbuds', category: 'Electronics', sales: 38, revenue: 5243.62 },
  { id: 3, name: 'Running Shoes', category: 'Fashion', sales: 34, revenue: 4419.66 },
  { id: 4, name: 'Coffee Maker', category: 'Home', sales: 31, revenue: 8399.69 },
  { id: 5, name: 'Fitness Tracker', category: 'Electronics', sales: 28, revenue: 2771.72 },
];

export default function Dashboard() {
  const [orderStats, setOrderStats] = useState<any>({
    total: 0,
    byStatus: [],
    recentTrend: 0
  });
  
  const [paymentStats, setPaymentStats] = useState<any>({
    total: 0,
    successful: 0,
    failed: 0,
    byMethod: [],
    totalAmount: 0
  });
  
  const [productStats, setProductStats] = useState<any>({
    total: 0,
    categoryCounts: []
  });
  
  const [collectionStats, setCollectionStats] = useState<any>({
    total: 0,
    popularCollections: []
  });
  
  const [brandStats, setBrandStats] = useState<any>({
    topBrands: []
  });
  
  const [collectionTypeStats, setCollectionTypeStats] = useState<any>({
    byType: []
  });
  
  const [revenueStats, setRevenueStats] = useState<any>({
    total: 0,
    avgOrderValue: 0,
    byMonth: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all analytics data from a single endpoint
        const dashboardStats = await analyticsApi.getDashboardStats();
        
        // Process order statistics
        const ordersByStatus = dashboardStats.orders.byStatus || {};
        const orderStatusData = Object.entries(ordersByStatus).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count as number
        }));
        
        setOrderStats({
          total: dashboardStats.orders.total || 0,
          byStatus: orderStatusData,
          recentTrend: dashboardStats.orders.trend?.percentage || 0
        });
        
        // Set recent orders
        setRecentOrders(dashboardStats.orders.recentOrders || []);
        
        // Process payment statistics
        const paymentsByStatus = dashboardStats.payments.byStatus || {};
        const paymentsByMethod = dashboardStats.payments.byMethod || {};
        
        const paymentMethodData = Object.entries(paymentsByMethod).map(([method, count]) => ({
          name: method.charAt(0).toUpperCase() + method.slice(1),
          value: count as number
        }));
        
        setPaymentStats({
          total: dashboardStats.payments.total || 0,
          successful: paymentsByStatus.captured || 0,
          failed: paymentsByStatus.failed || 0,
          byMethod: paymentMethodData,
          totalAmount: dashboardStats.revenue.total || 0
        });
        
        // Set recent payments
        setRecentPayments(dashboardStats.payments.recentPayments || []);
        
        // Process product statistics
        const productsByCategory = dashboardStats.products.byCategory || {};
        
        const categoryData = Object.entries(productsByCategory).map(([category, count]) => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: count as number
        }));
        
        setProductStats({
          total: dashboardStats.products.total || 0,
          categoryCounts: categoryData
        });
        
        // Process collection statistics
        const topCollections = dashboardStats.collections.topCollections || [];
        
        const collectionData = topCollections.map((collection: Collection) => ({
          name: collection.name,
          value: parseInt(collection.product_count as string) || 0
        }));
        
        setCollectionStats({
          total: dashboardStats.collections.total || 0,
          popularCollections: collectionData
        });
        
        // Process brand statistics
        const topBrands = dashboardStats.products.topBrands || {};
        const brandData = Object.entries(topBrands).map(([brand, count]) => ({
          name: brand,
          value: count as number
        }));
        
        setBrandStats({
          topBrands: brandData
        });
        
        // Process collection type statistics
        const collectionTypes = dashboardStats.collections.byType || {};
        const collectionTypeData = Object.entries(collectionTypes).map(([type, count]) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          value: count as number
        }));
        
        setCollectionTypeStats({
          byType: collectionTypeData
        });
        
        // Process revenue statistics
        setRevenueStats({
          total: dashboardStats.revenue.total || 0,
          avgOrderValue: dashboardStats.revenue.avgOrderValue || 0,
          byMonth: dashboardStats.revenue.byMonth || []
        });
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, []);

  // Add a new function to calculate additional KPIs
  const calculateKPIs = () => {
    // Calculate conversion rate (completed orders / total orders)
    let conversionRate = 0;
    const completedOrders = orderStats.byStatus.find((status: any) => status.name === 'Completed')?.value || 0;
    if (orderStats.total > 0) {
      conversionRate = (completedOrders / orderStats.total) * 100;
    }
    
    // Calculate payment success rate
    let paymentSuccessRate = 0;
    if (paymentStats.total > 0) {
      paymentSuccessRate = (paymentStats.successful / paymentStats.total) * 100;
    }
    
    // Calculate average products per collection
    let avgProductsPerCollection = 0;
    if (collectionStats.total > 0 && productStats.total > 0) {
      avgProductsPerCollection = productStats.total / collectionStats.total;
    }
    
    return {
      conversionRate,
      paymentSuccessRate,
      avgProductsPerCollection
    };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 h-36">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
            <div className="mt-2 flex items-center">
              <span className="text-3xl font-bold">{orderStats.total}</span>
              <span className={`ml-2 flex items-center text-sm ${orderStats.recentTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {orderStats.recentTrend >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(Math.round(orderStats.recentTrend))}%
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Last 7 days vs previous period</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Payment Success Rate</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">
                {paymentStats.total ? 
                  Math.round((paymentStats.successful / paymentStats.total) * 100) : 0}%
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {paymentStats.successful} successful / {paymentStats.total} total
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">{formatCurrency(paymentStats.totalAmount)}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">From {orderStats.total} orders</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Products</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">{productStats.total}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Across {collectionStats.total} collections</p>
          </div>
        </Card>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Orders by Status">
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStats.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStats.byStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card title="Payment Methods">
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentStats.byMethod}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card
          title="Weekly Sales"
          subtitle="Revenue for the past 7 days"
          className="col-span-2"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Bar dataKey="value" fill="#4f46e5" barSize={30} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Top Products"
          subtitle="Best performing products"
        >
          <div className="divide-y divide-gray-200">
            {topProducts.map((product) => (
              <div key={product.id} className="py-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{product.sales} sold</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* More detailed statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Payment Status Breakdown">
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Successful Payments</span>
                <span className="text-green-600 font-medium">{paymentStats.successful}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${paymentStats.total ? (paymentStats.successful / paymentStats.total) * 100 : 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Failed Payments</span>
                <span className="text-red-600 font-medium">{paymentStats.failed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-red-600 h-2.5 rounded-full" 
                  style={{ width: `${paymentStats.total ? (paymentStats.failed / paymentStats.total) * 100 : 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Pending Payments</span>
                <span className="text-yellow-600 font-medium">
                  {paymentStats.total - paymentStats.successful - paymentStats.failed}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-yellow-600 h-2.5 rounded-full" 
                  style={{ width: `${paymentStats.total ? ((paymentStats.total - paymentStats.successful - paymentStats.failed) / paymentStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card title="Order Fulfillment Status">
          <div className="p-4">
            <div className="space-y-4">
              {orderStats.byStatus.map((status: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{status.name}</span>
                    <span className="font-medium">{status.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ 
                        width: `${orderStats.total ? (status.value / orderStats.total) * 100 : 0}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Orders">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.user_name || `User #${order.user_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${orderStatusColors[order.status as keyof typeof orderStatusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(Number(order.total || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="py-2 px-4 border-t border-gray-200">
            <Link href="/orders" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all orders →
            </Link>
          </div>
        </Card>
        
        <Card title="Recent Payments">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      #{payment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/orders/${payment.order_id}`} className="text-indigo-600 hover:underline">
                        #{payment.order_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${payment.status === 'captured' 
                          ? 'bg-green-100 text-green-800' 
                          : payment.status === 'failed' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(Number(payment.amount || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="py-2 px-4 border-t border-gray-200">
            <Link href="/payments" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all payments →
            </Link>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Products by Category">
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productStats.categoryCounts}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card title="Top Collections by Products">
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={collectionStats.popularCollections}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Brands">
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandStats.topBrands}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Products" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card title="Collection Types">
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collectionTypeStats.byType}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {collectionTypeStats.byType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Revenue Metrics">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Total Revenue</h4>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(revenueStats.total)}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Average Order Value</h4>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(revenueStats.avgOrderValue)}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Orders Count</h4>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{orderStats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card title="Product Insights">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Total Products</h4>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{productStats.total}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Categories</h4>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{productStats.categoryCounts.length}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Top Brand</h4>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {brandStats.topBrands.length > 0 ? brandStats.topBrands[0].name : 'None'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card title="Collection Insights">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Total Collections</h4>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{collectionStats.total}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Collection Types</h4>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{collectionTypeStats.byType.length}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Top Collection</h4>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {collectionStats.popularCollections.length > 0 ? collectionStats.popularCollections[0].name : 'None'}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Monthly Revenue Trend */}
      <Card title="Monthly Revenue Trend">
        <div className="p-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueStats.byMonth.map((item: any) => ({
                month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: item.total
              }))}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Business KPIs */}
      <Card title="Business KPIs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700">Order Conversion Rate</h4>
            <p className="mt-2 text-2xl font-bold text-blue-900">
              {calculateKPIs().conversionRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Completed Orders / Total Orders
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-700">Payment Success Rate</h4>
            <p className="mt-2 text-2xl font-bold text-green-900">
              {calculateKPIs().paymentSuccessRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-green-600">
              Successful Payments / Total Payments
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-700">Products per Collection</h4>
            <p className="mt-2 text-2xl font-bold text-purple-900">
              {calculateKPIs().avgProductsPerCollection.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-purple-600">
              Average number of products per collection
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
