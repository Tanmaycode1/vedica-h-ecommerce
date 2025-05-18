'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon, 
  TruckIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { ordersApi, paymentsApi } from '@/lib/api';

const orderStatusColors = {
  pending: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
};

const paymentStatusColors = {
  pending: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const orderStatusIcons = {
  pending: ArrowPathIcon,
  processing: TruckIcon,
  completed: CheckCircleIcon,
  cancelled: XCircleIcon,
  shipped: TruckIcon,
  delivered: CheckCircleIcon,
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.id as string);
  
  const [order, setOrder] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setIsLoading(true);
        const data = await ordersApi.getById(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast.error('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [orderId]);
  
  useEffect(() => {
    const fetchPayments = async () => {
      if (!orderId) return;
      
      try {
        setIsLoadingPayments(true);
        const data = await paymentsApi.getPaymentsByOrderId(orderId);
        if (data && data.payments) {
          setPayments(data.payments);
        }
      } catch (error: any) {
        // If it's a 404, it's expected that payments may not exist yet
        if (error?.response?.status !== 404) {
          console.error('Error fetching payment details:', error);
        }
        setPayments([]); // Set empty array for payments if there's an error
      } finally {
        setIsLoadingPayments(false);
      }
    };
    
    fetchPayments();
  }, [orderId]);
  
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    
    try {
      // Update order status
      await ordersApi.updateStatus(orderId, newStatus);
      
      // Update the local state
      setOrder((prev: any) => ({
        ...prev,
        status: newStatus
      }));
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePaymentStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    
    try {
      // Update payment status
      await ordersApi.updatePaymentStatus(orderId, newStatus);
      
      // Update the local state
      setOrder((prev: any) => ({
        ...prev,
        payment_status: newStatus
      }));
      
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCreatePayment = async () => {
    setIsCreatingPayment(true);
    
    try {
      const result = await paymentsApi.createPaymentOrder(orderId);
      setPayments((prev: any[]) => [result.payment, ...prev]);
      toast.success('Payment order created successfully');
      
      // Copy Razorpay order ID to clipboard
      navigator.clipboard.writeText(result.payment.razorpay_order_id);
      toast.success('Razorpay Order ID copied to clipboard');
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error('Failed to create payment order');
    } finally {
      setIsCreatingPayment(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 text-center">
            <div className="animate-pulse">Loading order details...</div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 text-center">
            <div className="text-red-500">Order not found</div>
            <Button
              variant="outline"
              onClick={() => router.push('/orders')}
              className="mt-4"
              icon={<ArrowLeftIcon className="h-5 w-5" />}
            >
              Back to Orders
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  const StatusIcon = orderStatusIcons[order.status as keyof typeof orderStatusIcons] || ArrowPathIcon;
  
  // Format the addresses
  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address;
    
  const billingAddress = typeof order.billing_address === 'string' 
    ? JSON.parse(order.billing_address) 
    : order.billing_address;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/orders')}
            icon={<ArrowLeftIcon className="h-5 w-5" />}
          >
            Back to Orders
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <StatusIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-current" />
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${orderStatusColors[order.status as keyof typeof orderStatusColors] || 'bg-gray-100 text-gray-800'}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center">
            <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-current" />
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors] || 'bg-gray-100 text-gray-800'}`}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card title="Order Items">
            <div className="divide-y divide-gray-200">
              {order.items && order.items.map((item: any) => (
                <div key={item.id} className="py-4 flex items-center">
                  <div className="flex-shrink-0 w-16 h-16">
                    {item.image ? (
                      <img
                        src={`${item.image.startsWith('http') ? '' : 'http://localhost:3002/uploads/'}${item.image}`}
                        alt={item.title || 'Product'}
                        className="w-16 h-16 rounded-md object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://placehold.co/100x100?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span>Quantity: {item.quantity}</span>
                      <span className="mx-2">•</span>
                      <span>Price: ₹{typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : Number(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="text-sm font-medium text-gray-900">
                      Subtotal: ₹{typeof item.price === 'string' 
                        ? (parseFloat(item.price) * item.quantity).toFixed(2) 
                        : (Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">
                  {typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
          
          {/* Razorpay Payments */}
          <Card 
            title="Payment Information" 
            actions={
              order.payment_method === 'razorpay' && order.payment_status !== 'paid' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreatePayment}
                  loading={isCreatingPayment}
                  disabled={isCreatingPayment}
                  icon={<CurrencyRupeeIcon className="h-4 w-4" />}
                >
                  Create Payment Order
                </Button>
              ) : null
            }
          >
            {isLoadingPayments ? (
              <div className="animate-pulse space-y-3 py-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                {order.payment_method === 'razorpay' ? (
                  <div>
                    <p>No payment records found.</p>
                    {order.payment_status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreatePayment}
                        className="mt-3"
                        loading={isCreatingPayment}
                        disabled={isCreatingPayment}
                        icon={<CurrencyRupeeIcon className="h-4 w-4" />}
                      >
                        Create Payment Order
                      </Button>
                    )}
                  </div>
                ) : (
                  <p>No payment information available for {order.payment_method} payments.</p>
                )}
              </div>
            ) : (
              <>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-900">Payment Method</div>
                    <div className="text-sm text-gray-900">{order.payment_method}</div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm font-medium text-gray-900">Payment Status</div>
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Display Razorpay IDs from order if available */}
                  {order.razorpay_order_id && (
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm font-medium text-gray-900">Razorpay Order ID</div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{order.razorpay_order_id}</span>
                        <button 
                          onClick={() => copyToClipboard(order.razorpay_order_id, 'Order ID copied to clipboard')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {order.razorpay_payment_id && (
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm font-medium text-gray-900">Razorpay Payment ID</div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{order.razorpay_payment_id}</span>
                        <button 
                          onClick={() => copyToClipboard(order.razorpay_payment_id, 'Payment ID copied to clipboard')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {payments.map((payment, index) => (
                  <div 
                    key={payment.id || index} 
                    className={`border rounded-lg overflow-hidden mb-4 ${
                      payment.status === 'captured' 
                        ? 'border-green-200' 
                        : payment.status === 'failed' 
                          ? 'border-red-200' 
                          : 'border-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-3 text-sm font-medium ${
                      payment.status === 'captured' 
                        ? 'bg-green-50 text-green-800' 
                        : payment.status === 'failed' 
                          ? 'bg-red-50 text-red-800' 
                          : 'bg-gray-50 text-gray-800'
                    }`}>
                      Payment #{payment.id} 
                      <span className="ml-2 font-normal">({payment.status})</span>
                      <span className="ml-2 text-xs text-gray-600">{formatDate(payment.created_at)}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">Razorpay Order ID</div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">{payment.razorpay_order_id}</span>
                          <button 
                            onClick={() => copyToClipboard(payment.razorpay_order_id, 'Order ID copied to clipboard')}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {payment.razorpay_payment_id && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-700">Payment ID</div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 mr-2">{payment.razorpay_payment_id}</span>
                            <button 
                              onClick={() => copyToClipboard(payment.razorpay_payment_id, 'Payment ID copied to clipboard')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">Amount</div>
                        <div className="text-sm text-gray-900">{payment.currency} {typeof payment.amount === 'number' ? payment.amount.toFixed(2) : payment.amount}</div>
                      </div>
                      
                      {payment.error_code && (
                        <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
                          <div className="text-sm font-medium text-red-800">Error: {payment.error_code}</div>
                          {payment.error_description && (
                            <div className="text-sm text-red-700 mt-1">{payment.error_description}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Payment Status Actions */}
                {order.payment_status !== 'paid' && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handlePaymentStatusChange('paid')}
                      disabled={isUpdating}
                      icon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                      Mark as Paid
                    </Button>
                    
                    {order.payment_status !== 'failed' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handlePaymentStatusChange('failed')}
                        disabled={isUpdating}
                        icon={<XCircleIcon className="h-4 w-4" />}
                      >
                        Mark as Failed
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </Card>
          
          {/* Update Status */}
          {(order.status === 'pending' || order.status === 'processing') && (
            <Card title="Update Order Status">
              <div className="flex flex-wrap gap-4">
                {order.status === 'pending' && (
                  <Button
                    onClick={() => handleStatusChange('processing')}
                    disabled={isUpdating}
                    icon={<TruckIcon className="h-5 w-5" />}
                  >
                    Mark as Processing
                  </Button>
                )}
                {order.status !== 'completed' && (
                  <Button
                    variant="success"
                    onClick={() => handleStatusChange('completed')}
                    disabled={isUpdating}
                    icon={<CheckCircleIcon className="h-5 w-5" />}
                  >
                    Mark as Completed
                  </Button>
                )}
                {order.status !== 'cancelled' && (
                  <Button
                    variant="danger"
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={isUpdating}
                    icon={<XCircleIcon className="h-5 w-5" />}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Order Information */}
          <Card title="Order Information">
            <div className="divide-y divide-gray-200">
              <div className="py-3 flex justify-between">
                <span className="text-sm font-medium text-gray-500">Order Date</span>
                <span className="text-sm text-gray-900">{formatDate(order.created_at)}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-sm font-medium text-gray-500">Payment Method</span>
                <span className="text-sm text-gray-900">{order.payment_method}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-sm font-medium text-gray-500">Total Items</span>
                <span className="text-sm text-gray-900">{order.items ? order.items.length : 0}</span>
              </div>
              {order.tracking_number && (
                <div className="py-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Tracking #</span>
                  <span className="text-sm text-gray-900">{order.tracking_number}</span>
                </div>
              )}
            </div>
          </Card>
          
          {/* Customer & Address Information */}
          <Card title="Customer Information">
            <div className="divide-y divide-gray-200">
              <div className="py-3 flex justify-between">
                <span className="text-sm font-medium text-gray-500">Customer ID</span>
                <span className="text-sm text-gray-900">#{order.user_id}</span>
              </div>
              {(order.user_name || order.user_email) && (
                <div className="py-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Customer Details</span>
                  <div className="text-right">
                    {order.user_name && <div className="text-sm text-gray-900">{order.user_name}</div>}
                    {order.user_email && <div className="text-sm text-gray-500">{order.user_email}</div>}
                  </div>
                </div>
              )}
              {shippingAddress && (
                <div className="py-3">
                  <div className="text-sm font-medium text-gray-500 mb-2">Shipping Address</div>
                  <div className="text-sm text-gray-900">
                    <div>{shippingAddress.name}</div>
                    {shippingAddress.address_line1 && <div>{shippingAddress.address_line1}</div>}
                    {shippingAddress.address_line2 && <div>{shippingAddress.address_line2}</div>}
                    <div>
                      {shippingAddress.city && `${shippingAddress.city}, `}
                      {shippingAddress.state && `${shippingAddress.state}, `}
                      {shippingAddress.postal_code}
                    </div>
                    {shippingAddress.country && <div>{shippingAddress.country}</div>}
                    {shippingAddress.phone && <div>Phone: {shippingAddress.phone}</div>}
                  </div>
                </div>
              )}
              
              {billingAddress && billingAddress !== shippingAddress && (
                <div className="py-3">
                  <div className="text-sm font-medium text-gray-500 mb-2">Billing Address</div>
                  <div className="text-sm text-gray-900">
                    <div>{billingAddress.name}</div>
                    {billingAddress.address_line1 && <div>{billingAddress.address_line1}</div>}
                    {billingAddress.address_line2 && <div>{billingAddress.address_line2}</div>}
                    <div>
                      {billingAddress.city && `${billingAddress.city}, `}
                      {billingAddress.state && `${billingAddress.state}, `}
                      {billingAddress.postal_code}
                    </div>
                    {billingAddress.country && <div>{billingAddress.country}</div>}
                    {billingAddress.phone && <div>Phone: {billingAddress.phone}</div>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 