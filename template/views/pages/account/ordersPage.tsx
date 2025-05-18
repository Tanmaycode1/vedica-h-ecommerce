import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Row, Col, Table, Button, Spinner, Alert, Badge, Card, CardHeader, CardBody, CardFooter } from "reactstrap";
import Breadcrumb from "../../Containers/Breadcrumb";
import firebase from "../../../config/base";
import { useRouter } from "next/router";
import apiService from "../../../helpers/apiService";
import { toast } from "react-toastify";
import Link from "next/link";

// Order type definition
interface OrderItem {
  id: number;
  product_id: number;
  title: string;
  variant_name?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface Order {
  id: number;
  status: string;
  total: number;
  created_at: string;
  payment_status: string;
  payment_method: string;
  shipping_address?: Address;
  billing_address?: Address;
  items?: OrderItem[];
  first_name: string;
  last_name: string;
  user_email: string;
  updated_at?: string;
}

const OrdersPage: NextPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      router.push('/pages/account/login');
      return;
    }

    fetchOrders();
    
    // Add custom styles for this page
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hindu Theme Colors */
      :root {
        --primary-color: #FF9933;
        --primary-dark: #E08224;
        --primary-light: #FFE6CC;
        --secondary-color: #9A3324;
        --secondary-dark: #7D2A1E;
        --secondary-light: #E8D8D5;
        --text-primary: #333333;
        --text-secondary: #6c757d;
        --border-color: #e9ecef;
        --card-shadow: 0 2px 8px rgba(154, 51, 36, 0.1);
      }
      
      .order-card {
        border-radius: 8px;
        box-shadow: var(--card-shadow);
        border: 1px solid rgba(255, 153, 51, 0.2);
        margin-bottom: 20px;
        background: #fff;
        transition: box-shadow 0.2s ease;
        overflow: hidden;
      }
      
      .order-card:hover {
        box-shadow: 0 4px 12px rgba(154, 51, 36, 0.15);
      }
      
      .order-header {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
        color: white;
        border-radius: 8px 8px 0 0;
        padding: 16px 20px;
        position: relative;
        overflow: hidden;
      }
      
      .order-header::after {
        content: "";
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 20px;
        opacity: 0.15;
        transform: rotate(45deg);
      }
      
      .order-footer {
        background: #fffaf5;
        border-top: 1px solid rgba(255, 153, 51, 0.2);
        border-radius: 0 0 8px 8px;
        padding: 16px 20px;
      }
      
      .custom-badge {
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .badge-primary {
        background-color: var(--primary-light);
        color: var(--primary-dark);
        border: 1px solid rgba(255, 153, 51, 0.2);
      }
      
      .badge-success {
        background-color: #e6f7e6;
        color: #198754;
        border: 1px solid rgba(25, 135, 84, 0.2);
      }
      
      .badge-warning {
        background-color: #fff8e6;
        color: #cc9900;
        border: 1px solid rgba(204, 153, 0, 0.2);
      }
      
      .badge-info {
        background-color: #e6f9ff;
        color: #0dcaf0;
        border: 1px solid rgba(13, 202, 240, 0.2);
      }
      
      .badge-danger {
        background-color: #ffebeb;
        color: #dc3545;
        border: 1px solid rgba(220, 53, 69, 0.2);
      }
      
      .blue-btn {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        border-radius: 6px;
        font-weight: 500;
        padding: 8px 16px;
        transition: all 0.2s ease;
        color: white;
      }
      
      .blue-btn:hover {
        background-color: var(--primary-dark);
        border-color: var(--primary-dark);
        box-shadow: 0 2px 8px rgba(154, 51, 36, 0.2);
      }
      
      .blue-btn.outline {
        background-color: transparent;
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
      
      .blue-btn.outline:hover {
        background-color: var(--primary-light);
        color: var(--primary-dark);
        border-color: var(--primary-dark);
      }
      
      .info-section {
        background-color: #fffaf5;
        border: 1px solid rgba(255, 153, 51, 0.2);
        border-radius: 6px;
        padding: 16px;
        height: 100%;
      }
      
      .info-section-title {
        color: var(--secondary-color);
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px dashed rgba(255, 153, 51, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .order-id {
        background: var(--primary-light);
        color: var(--secondary-color);
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
      }
      
      .table-header {
        background-color: #fffaf5;
        font-weight: 600;
        color: var(--secondary-color);
      }
      
      .table-header th {
        border-bottom: 2px solid rgba(255, 153, 51, 0.3) !important;
        border-top: none !important;
        padding: 12px 16px;
      }
      
      .item-row td {
        padding: 16px;
        vertical-align: middle;
        border-bottom: 1px solid rgba(255, 153, 51, 0.1);
      }
      
      .item-row:hover {
        background-color: #fffaf5;
      }
      
      .price-text {
        color: var(--primary-color);
        font-weight: 600;
      }
      
      .method-badge {
        background: var(--primary-light);
        color: var(--secondary-color);
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        display: inline-block;
      }
      
      .empty-state {
        text-align: center;
        padding: 60px 0;
      }
      
      .empty-icon {
        background: var(--primary-light);
        color: var(--secondary-color);
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        border: 1px dashed rgba(255, 153, 51, 0.5);
      }
      
      .section-title {
        color: var(--secondary-color);
        position: relative;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      
      .section-title:after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, 
          var(--primary-color) 0%, 
          var(--secondary-color) 100%);
      }
      
      .fadeIn {
        animation: fadeIn 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .detail-card {
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 20px;
        margin-bottom: 16px;
        transition: box-shadow 0.2s ease;
      }
      
      .detail-card:hover {
        box-shadow: var(--card-shadow);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Clean up
      document.head.removeChild(style);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Starting to fetch orders...");
      
      // Get fresh token using the apiService's checkAuth
      const token = await apiService.checkAuth();
      
      if (!token) {
        console.error("Could not obtain a valid authentication token");
        setError("Authentication error. Please log in again.");
        toast.error("Session expired. Please log in again.");
        setTimeout(() => router.push('/pages/account/login'), 1500);
        return;
      }
      
      // Now use the token to fetch orders
      console.log("Token obtained, fetching orders...");
      const response = await apiService.getUserOrders(token);
      
      if (response.success) {
        console.log("Orders loaded successfully:", response.orders);
        setOrders(response.orders || []);
      } else {
        console.error("Error fetching orders:", response);
        if (response.status === 401) {
          setError("Your session has expired. Please log in again.");
          toast.error("Session expired. Please log in again.");
          
          // Clear local storage and redirect to login
          localStorage.removeItem("userInfo");
          setTimeout(() => router.push('/pages/account/login'), 1500);
        } else {
          setError(response.message || "Failed to load orders");
          toast.error(response.message || "Failed to load orders");
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Error fetching orders");
      toast.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setLoading(true);
      
      // Get fresh token
      const token = await apiService.checkAuth();
      
      if (!token) {
        toast.error("Authentication error. Please log in again.");
        router.push('/pages/account/login');
        return;
      }
      
      const response = await apiService.getOrderById(orderId, token);
      
      if (response.success) {
        console.log("Order details loaded:", response);
        setSelectedOrder(response);
      } else {
        toast.error("Failed to load order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Error fetching order details");
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusBadge = (status: any) => {
    // Ensure status is a string before calling toLowerCase
    const statusStr = status && typeof status === 'string' ? status.toLowerCase() : String(status || '').toLowerCase();
    
    switch (statusStr) {
      case 'processing':
        return (
          <Badge color="" className="custom-badge badge-warning">
            <i className="fa fa-clock-o mr-1"></i> {status}
          </Badge>
        );
      case 'shipped':
        return (
          <Badge color="" className="custom-badge badge-info">
            <i className="fa fa-truck mr-1"></i> {status}
          </Badge>
        );
      case 'delivered':
        return (
          <Badge color="" className="custom-badge badge-success">
            <i className="fa fa-check mr-1"></i> {status}
          </Badge>
        );
      case 'completed':
        return (
          <Badge color="" className="custom-badge badge-success">
            <i className="fa fa-check mr-1"></i> {status}
          </Badge>
        );
      case 'canceled':
        return (
          <Badge color="" className="custom-badge badge-danger">
            <i className="fa fa-times mr-1"></i> {status}
          </Badge>
        );
      default:
        return (
          <Badge color="" className="custom-badge badge-primary">
            <i className="fa fa-info-circle mr-1"></i> {status || 'Unknown'}
          </Badge>
        );
    }
  };
  
  const getPaymentStatusBadge = (status: any) => {
    // Ensure status is a string before calling toLowerCase
    const statusStr = status && typeof status === 'string' ? status.toLowerCase() : String(status || '').toLowerCase();
    
    switch (statusStr) {
      case 'paid':
        return (
          <Badge color="" className="custom-badge badge-success">
            <i className="fa fa-check-circle mr-1"></i> {status}
          </Badge>
        );
      case 'pending':
        return (
          <Badge color="" className="custom-badge badge-warning">
            <i className="fa fa-clock-o mr-1"></i> {status}
          </Badge>
        );
      case 'failed':
        return (
          <Badge color="" className="custom-badge badge-danger">
            <i className="fa fa-times-circle mr-1"></i> {status}
          </Badge>
        );
      case 'refunded':
        return (
          <Badge color="" className="custom-badge badge-info">
            <i className="fa fa-reply mr-1"></i> {status}
          </Badge>
        );
      default:
        return (
          <Badge color="" className="custom-badge badge-primary">
            <i className="fa fa-info-circle mr-1"></i> {status || 'Unknown'}
          </Badge>
        );
    }
  };

  if (loading && !orders.length) {
    return (
      <div className="text-center my-5 py-5">
        <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-4 text-muted">Loading your order history...</p>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <div className="my-5">
        <Alert color="danger" style={{ borderRadius: '6px' }}>
          <h5 className="alert-heading">Authentication Error</h5>
          <p>{error}</p>
          <hr />
          <Link href="/pages/account/login">
            <Button color="danger" outline>Return to Login</Button>
          </Link>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb title="My Orders" parent="Account" />
      <section className="section-big-py-space bg-light">
        <div className="custom-container">
          {orders.length === 0 ? (
            <div className="empty-state fadeIn">
              <div className="empty-icon">
                <i className="fa fa-shopping-bag fa-2x"></i>
              </div>
              <h5>You haven't placed any orders yet</h5>
              <p className="text-muted mb-4">When you place orders, they will appear here</p>
              <Link href="/collections/leftsidebar">
                <Button className="blue-btn">
                  <i className="fa fa-shopping-cart mr-2"></i>
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            selectedOrder ? (
              <div className="fadeIn">
                <div className="mb-4">
                  <Button 
                    className="blue-btn outline mb-4"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <i className="fa fa-arrow-left mr-2"></i> Back to Orders
                  </Button>
                  
                  <div className="order-card">
                    <div className="order-header">
                      <Row className="align-items-center">
                        <Col md={7}>
                          <h5 className="mb-2">
                            Order <span className="order-id">#{selectedOrder.id}</span>
                          </h5>
                          <p className="mb-0 small">
                            <i className="fa fa-calendar mr-2"></i> {formatDate(selectedOrder.created_at)}
                          </p>
                        </Col>
                        <Col md={5} className="text-md-right mt-3 mt-md-0">
                          <div className="mb-2">
                            {getStatusBadge(selectedOrder.status)}
                          </div>
                          <div>
                            {getPaymentStatusBadge(selectedOrder.payment_status)}
                          </div>
                        </Col>
                      </Row>
                    </div>
                    
                    <CardBody className="p-4">
                      <h5 className="section-title">Order Items</h5>
                      
                      <div className="table-responsive mb-4">
                        <Table borderless hover className="mb-0">
                          <thead>
                            <tr className="table-header">
                              <th>Product</th>
                              <th>Price</th>
                              <th>Quantity</th>
                              <th className="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items && selectedOrder.items.map((item) => (
                              <tr key={item.id} className="item-row">
                                <td>
                                  <div className="d-flex align-items-center">
                                    {item.image ? (
                                      <img 
                                        src={item.image} 
                                        alt={item.title} 
                                        className="rounded"
                                        style={{ 
                                          width: 50, 
                                          height: 50, 
                                          objectFit: 'cover', 
                                          marginRight: 15,
                                          border: '1px solid var(--border-color)'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        className="rounded d-flex align-items-center justify-content-center text-muted" 
                                        style={{ 
                                          width: 50, 
                                          height: 50, 
                                          marginRight: 15,
                                          background: '#f8f9fa',
                                          border: '1px solid var(--border-color)'
                                        }}
                                      >
                                        <i className="fa fa-image"></i>
                                      </div>
                                    )}
                                    <div>
                                      <h6 className="mb-0">{item.title}</h6>
                                      {item.variant_name && (
                                        <small className="text-muted">{item.variant_name}</small>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>₹{parseFloat(item.price.toString()).toFixed(2)}</td>
                                <td>{item.quantity}</td>
                                <td className="text-right price-text">
                                  ₹{(parseFloat(item.price.toString()) * item.quantity).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={3} className="text-right pt-3">
                                <strong>Order Total:</strong>
                              </td>
                              <td className="text-right pt-3">
                                <strong className="price-text" style={{ fontSize: '1.1rem' }}>
                                  ₹{parseFloat(selectedOrder.total.toString()).toFixed(2)}
                                </strong>
                              </td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                      
                      <Row>
                        <Col md={6} className="mb-4 mb-md-0">
                          <div className="info-section">
                            <div className="info-section-title">
                              <i className="fa fa-credit-card mr-2"></i>
                              Payment Information
                            </div>
                            <div>
                              <p className="mb-2">
                                <strong>Method:</strong> 
                                <span className="method-badge ml-2">
                                  {selectedOrder.payment_method}
                                </span>
                              </p>
                              <p className="mb-0">
                                <strong>Status:</strong> 
                                {getPaymentStatusBadge(selectedOrder.payment_status)}
                              </p>
                              <p className="mb-0 mt-2">
                                <strong>Customer:</strong> {selectedOrder.first_name} {selectedOrder.last_name}
                              </p>
                              <p className="mb-0">
                                <strong>Email:</strong> {selectedOrder.user_email}
                              </p>
                              <p className="mb-0">
                                <strong>Order Date:</strong> {formatDate(selectedOrder.created_at)}
                              </p>
                              {selectedOrder.updated_at && (
                                <p className="mb-0">
                                  <strong>Last Updated:</strong> {formatDate(selectedOrder.updated_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Col>
                        
                        <Col md={6}>
                          <div className="info-section">
                            <div className="info-section-title">
                              <i className="fa fa-truck mr-2"></i>
                              Shipping Information
                            </div>
                            <div>
                              {selectedOrder.shipping_address ? (
                                <address className="mb-3">
                                  <strong>Address:</strong><br />
                                  {selectedOrder.shipping_address.street}
                                  {selectedOrder.shipping_address.apartment && <span>, {selectedOrder.shipping_address.apartment}</span>}<br />
                                  {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip_code}<br />
                                  {selectedOrder.shipping_address.country}
                                </address>
                              ) : (
                                <p className="mb-0">No shipping information available</p>
                              )}
                              
                              {selectedOrder.billing_address && selectedOrder.billing_address !== selectedOrder.shipping_address && (
                                <>
                                  <div className="info-section-title mt-3">
                                    <i className="fa fa-file-text-o mr-2"></i>
                                    Billing Information
                                  </div>
                                  <address className="mb-0">
                                    <strong>Billing Address:</strong><br />
                                    {selectedOrder.billing_address.street}
                                    {selectedOrder.billing_address.apartment && <span>, {selectedOrder.billing_address.apartment}</span>}<br />
                                    {selectedOrder.billing_address.city}, {selectedOrder.billing_address.state} {selectedOrder.billing_address.zip_code}<br />
                                    {selectedOrder.billing_address.country}
                                  </address>
                                </>
                              )}
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fadeIn">
                <div className="order-card">
                  <div className="order-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">My Orders</h4>
                    <Button 
                      className="blue-btn"
                      onClick={fetchOrders}
                      disabled={loading}
                    >
                      {loading ? 
                        <><Spinner size="sm" className="mr-1" /> Refreshing...</> : 
                        <>Refresh <i className="fa fa-refresh ml-1"></i></>
                      }
                    </Button>
                  </div>
                  
                  <div className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead>
                        <tr className="table-header">
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="item-row">
                            <td><span className="order-id">#{order.id}</span></td>
                            <td>{formatDate(order.created_at)}</td>
                            <td className="price-text">₹{parseFloat(order.total.toString()).toFixed(2)}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>{getPaymentStatusBadge(order.payment_status)}</td>
                            <td className="text-center">
                              <Button 
                                className="blue-btn"
                                size="sm"
                                onClick={() => fetchOrderDetails(order.id)}
                              >
                                <i className="fa fa-eye mr-1"></i> View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  
                  <div className="order-footer d-flex justify-content-between align-items-center">
                    <small className="text-muted">Showing {orders.length} order{orders.length !== 1 ? 's' : ''}</small>
                    <Link href="/collections/leftsidebar">
                      <Button className="blue-btn outline">
                        <i className="fa fa-shopping-cart mr-1"></i> Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
};

export default OrdersPage; 