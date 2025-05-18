'use client';

import { useEffect, useState } from 'react';
import { paymentsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/20/solid';

// Payment status badge component
const PaymentStatusBadge = ({ status }: { status: string }) => {
  const statusStyles = {
    captured: 'bg-green-100 text-green-800',
    created: 'bg-blue-100 text-blue-800',
    authorized: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-yellow-100 text-yellow-800',
  };

  const statusIcons = {
    captured: <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1.5" />,
    created: <ClockIcon className="h-5 w-5 text-blue-500 mr-1.5" />,
    authorized: <ClockIcon className="h-5 w-5 text-blue-500 mr-1.5" />,
    failed: <XCircleIcon className="h-5 w-5 text-red-500 mr-1.5" />,
    refunded: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-1.5" />,
  };

  // Default style if status doesn't match predefined styles
  const style = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';
  const icon = statusIcons[status as keyof typeof statusIcons] || null;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Format date helper
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

// Format amount helper
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

// Payment status filter options
const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Captured', value: 'captured' },
  { label: 'Created', value: 'created' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await paymentsApi.getAllPayments();
      
      if (response && response.payments) {
        let filteredPayments = response.payments;
        
        // Apply status filter if set
        if (statusFilter) {
          filteredPayments = filteredPayments.filter(
            (payment: any) => payment.status === statusFilter
          );
        }
        
        setPayments(filteredPayments);
        setTotal(response.pagination?.total || filteredPayments.length);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, limit, statusFilter]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <Button
          variant="outline"
          onClick={fetchPayments}
          disabled={isLoading}
          icon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      <Card>
        {/* Filters */}
        <div className="px-4 py-3 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900">Payment List</h3>
          <div className="mt-3 sm:mt-0">
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              name="status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-6 px-4 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-6 px-4 text-center text-gray-500">
              No payments found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/orders/${payment.order_id}`} className="text-indigo-600 hover:text-indigo-900">
                        #{payment.order_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.user_name || 'N/A'}
                      {payment.user_email && (
                        <div className="text-xs text-gray-400">{payment.user_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAmount(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <PaymentStatusBadge status={payment.status} />
                      {payment.error_code && (
                        <div className="text-xs text-red-500 mt-1">
                          {payment.error_code}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_method || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/orders/${payment.order_id}`} className="text-indigo-600 hover:text-indigo-900">
                        <EyeIcon className="h-5 w-5 inline" />
                        <span className="sr-only">View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && payments.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startItem}</span> to{' '}
                  <span className="font-medium">{endItem}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <span className="sr-only">Previous</span>
                    &larr;
                  </Button>
                  {/* Page numbers would go here */}
                  <Button
                    variant="outline"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    <span className="sr-only">Next</span>
                    &rarr;
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 