'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EyeIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, TruckIcon } from '@heroicons/react/24/outline';
import { ordersApi } from '@/lib/api';

type OrderType = {
  id: number;
  user: {
    name: string;
    email: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  items: number;
  date: string;
  paymentMethod: string;
  [key: string]: any; // Add index signature to allow for additional properties
};

const orderStatusColors = {
  pending: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const orderStatusIcons = {
  pending: ArrowPathIcon,
  processing: TruckIcon,
  completed: CheckCircleIcon,
  cancelled: XCircleIcon,
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const ordersPerPage = 10;
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await ordersApi.getAll();
        
        if (data && data.orders) {
          // Map API response to match OrderType structure
          const formattedOrders = data.orders.map((order: any) => {
            return {
              id: order.id,
              user: {
                name: order.user_name || order.user?.name || `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() || 'Unknown',
                email: order.user_email || order.user?.email || 'Unknown',
              },
              status: order.status as OrderType['status'],
              totalAmount: order.total || order.totalAmount || 0,
              items: order.items?.length || order.item_count || 0,
              date: order.created_at || order.date || new Date().toISOString(),
              paymentMethod: order.payment_method || order.paymentMethod || 'Unknown',
            };
          });
          
          setOrders(formattedOrders);
          
          // Calculate total pages
          const total = data.total || data.orders.length;
          setTotalPages(Math.ceil(total / ordersPerPage));
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  // Filter orders by status
  const filteredOrders = filterStatus
    ? orders.filter(order => order.status === filterStatus)
    : orders;
  
  // Paginate orders
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );
  
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setIsUpdating(true);
    
    try {
      // Update order status
      await ordersApi.updateStatus(orderId, newStatus);
      
      // Update the local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as OrderType['status'] } 
            : order
        )
      );
      
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        
        <div className="flex items-center space-x-4">
          <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const StatusIcon = orderStatusIcons[order.status] || ArrowPathIcon;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                        <p className="text-xs text-gray-500">{order.items} items</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-medium text-gray-900">{order.user.name}</div>
                        <div className="text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-current" />
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${orderStatusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount}
                        <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => router.push(`/orders/${order.id}`)}
                          icon={<EyeIcon className="h-4 w-4" />}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * ordersPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * ordersPerPage, filteredOrders.length)}
              </span>{' '}
              of <span className="font-medium">{filteredOrders.length}</span> orders
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 