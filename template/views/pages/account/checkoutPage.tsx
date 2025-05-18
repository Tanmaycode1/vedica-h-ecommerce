import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Input, Label, Form, Row, Col, FormGroup, Spinner, Alert } from "reactstrap";
import { CartContext } from "../../../helpers/cart/cart.context";
import Breadcrumb from "../../../views/Containers/Breadcrumb";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { CurrencyContext } from "helpers/currency/CurrencyContext";
import firebase from "../../../config/base";
import apiService from "../../../helpers/apiService";
import { toast } from "react-toastify";
import Link from "next/link";
import Script from "next/script";

// Razorpay key
const RAZORPAY_KEY_ID = "rzp_test_KhepNSp0QTUjdH";

interface formType {
  firstName: string;
  lastName: string;
  phone: any;
  country: any;
  email: string;
  state: string;
  address: string;
  apartment?: string;
  city: string;
  pincode: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutPage: NextPage = () => {
  const { cartItems, cartTotal, emptyCart } = React.useContext(CartContext);
  const { selectedCurr } = React.useContext(CurrencyContext);
  const { symbol, value } = selectedCurr;
  const [obj, setObj] = useState({});
  const [payment, setPayment] = useState("razorpay");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    getValues
  } = useForm<formType>();

  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and fetch profile
    checkAuthAndFetchProfile();
    
    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      toast.warning("Your cart is empty. Please add items before checkout.");
      router.push('/collections/leftsidebar');
    }

    // Load Razorpay script
    const razorpayScript = document.createElement('script');
    razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
    razorpayScript.async = true;
    document.body.appendChild(razorpayScript);

    return () => {
      // Cleanup script when component unmounts
      if (document.body.contains(razorpayScript)) {
        document.body.removeChild(razorpayScript);
      }
    };
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const token = await apiService.checkAuth();
      
      if (!token) {
        console.log("User not authenticated, redirecting to login");
        setIsAuthenticated(false);
        setAuthError("Please login to proceed with checkout");
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/pages/account/login?redirect=checkout');
        }, 2000);
        return;
      }
      
      // User is authenticated, fetch profile
      setIsAuthenticated(true);
      const profileResponse = await apiService.getUserProfile(token);
      
      if (profileResponse.success && profileResponse.user) {
        setUserProfile(profileResponse.user);
        
        // Pre-fill form with user data
        const user = profileResponse.user;
        setValue('firstName', user.first_name || '');
        setValue('lastName', user.last_name || '');
        setValue('email', user.email || '');
        setValue('phone', user.phone || '');
        
        // If address exists, pre-fill address fields
        if (user.address) {
          setValue('address', user.address.street || '');
          setValue('apartment', user.address.apartment || '');
          setValue('city', user.address.city || '');
          setValue('state', user.address.state || '');
          setValue('country', user.address.country || 'India');
          setValue('pincode', user.address.zip_code || '');
        }
      } else {
        console.log("Failed to load user profile:", profileResponse);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to create order in the backend
  const createOrderInBackend = async (formData: formType, paymentDetails: any = null) => {
    try {
      // Prepare shipping address
      const shippingAddress = {
        street: formData.address,
        apartment: formData.apartment || '',
        city: formData.city,
        state: formData.state,
        zip_code: formData.pincode.toString(),
        country: formData.country
      };
      
      // Get token
      const token = await apiService.checkAuth();
      if (!token) {
        toast.error("Your session has expired. Please login again.");
        router.push('/pages/account/login?redirect=checkout');
        return null;
      }
      
      // Create order items from cart
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        variant_id: item.variants && item.variants.length > 0 ? item.variants[0].id : null,
        quantity: item.qty
      }));
      
      // Create order request
      const orderData = {
        items: orderItems,
        shipping_address: shippingAddress,
        payment_method: payment,
        payment_details: paymentDetails
      };
      
      console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
      
      // Call API to create order
      const response = await apiService.createOrder(orderData, token);
      
      if (response.success) {
        toast.success("Order placed successfully!");
        localStorage.setItem("order-success-items", JSON.stringify(cartItems));
        emptyCart();
        router.push({
          pathname: "/pages/order-success",
          query: { order_id: response.order?.id }
        });
        return response;
      } else {
        toast.error(response.message || "Failed to create order");
        console.error("Order creation failed:", response);
        return null;
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error creating order. Please try again.");
      return null;
    }
  };

  // Function to log payment attempt (success or failure)
  const logPaymentAttempt = async (paymentData) => {
    try {
      const token = await apiService.checkAuth();
      if (!token) {
        console.error("Failed to get authentication token for payment logging");
        return;
      }
      
      // Log the payment attempt
      const response = await apiService.logPaymentAttempt(paymentData, token);
      
      if (response.success) {
        console.log("Payment attempt logged successfully:", response);
      } else {
        console.error("Failed to log payment attempt:", response);
      }
    } catch (error) {
      console.error("Error logging payment attempt:", error);
    }
  };

  // Function to handle Razorpay payment
  const handleRazorpayPayment = async (formData: formType) => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK failed to load. Please try again later.");
      return;
    }

    setProcessingPayment(true);

    try {
      // Format order data for payment
      const orderAmount = Math.round(cartTotal * 100); // Convert to smallest currency unit (paise)
      const customerName = `${formData.firstName} ${formData.lastName}`;
      
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderAmount.toString(),
        currency: "INR",
        name: "BigDeal Store",
        description: "Payment for your purchase",
        prefill: {
          name: customerName,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.pincode}`
        },
        theme: {
          color: "#3399cc"
        },
        handler: function(response: any) {
          // Payment successful
          console.log("Payment successful:", response);
          
          // Create payment details object
          const paymentDetails = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            order_id: null, // Will be set after order creation
            amount: orderAmount / 100,
            currency: "INR",
            status: "success",
            payment_method: "razorpay",
            user_details: {
              name: customerName,
              email: formData.email,
              phone: formData.phone
            },
            timestamp: new Date().toISOString()
          };
          
          // Create order with payment details, then log the payment with the returned order ID
          createOrderInBackend(formData, paymentDetails)
            .then(orderResponse => {
              if (orderResponse && orderResponse.order && orderResponse.order.id) {
                // Update the payment details with the actual order ID
                const updatedPaymentDetails = {
                  ...paymentDetails,
                  order_id: orderResponse.order.id
                };
                
                // Log successful payment with order ID
                logPaymentAttempt(updatedPaymentDetails);
                console.log("Order created successfully with ID:", orderResponse.order.id);
              } else {
                // Still log payment even if order response format is unexpected
                logPaymentAttempt(paymentDetails);
              }
            })
            .catch(error => {
              console.error("Error creating order:", error);
              logPaymentAttempt(paymentDetails); // Still log the payment
            });
          
          setProcessingPayment(false);
        },
        modal: {
          ondismiss: function() {
            // Payment cancelled or failed
            const paymentDetails = {
              amount: orderAmount / 100,
              currency: "INR",
              status: "cancelled",
              payment_method: "razorpay",
              user_details: {
                name: customerName,
                email: formData.email,
                phone: formData.phone
              },
              error: "Payment cancelled by user",
              error_description: "User dismissed the payment modal",
              // The order ID might not be available yet
              timestamp: new Date().toISOString()
            };
            
            // Log cancelled payment
            logPaymentAttempt(paymentDetails);
            
            setProcessingPayment(false);
            toast.info("Payment cancelled. Please try again to complete your order.");
          }
        }
      };

      // Create Razorpay instance and open payment modal
      const razorpay = new window.Razorpay(options);
      
      // Handle payment errors
      razorpay.on('payment.failed', function(response: any) {
        const paymentDetails = {
          amount: orderAmount / 100,
          currency: "INR",
          status: "failed",
          payment_method: "razorpay",
          error_code: response.error.code,
          error_description: response.error.description,
          error_source: response.error.source,
          error_step: response.error.step,
          error_reason: response.error.reason,
          razorpay_order_id: response.error.metadata?.order_id,
          user_details: {
            name: customerName,
            email: formData.email,
            phone: formData.phone
          },
          timestamp: new Date().toISOString()
        };
        
        // Log failed payment
        logPaymentAttempt(paymentDetails);
        
        setProcessingPayment(false);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      
      razorpay.open();
    } catch (error) {
      console.error("Error initiating Razorpay payment:", error);
      
      // Log error in payment initiation
      const paymentDetails = {
        amount: Math.round(cartTotal * 100) / 100,
        currency: "INR",
        status: "error",
        payment_method: "razorpay",
        error: error.message || "Unknown error",
        error_description: error.message || "Error initiating payment",
        user_details: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone
        },
        timestamp: new Date().toISOString()
      };
      
      logPaymentAttempt(paymentDetails);
      
      toast.error("Failed to initiate payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  const onSubmit = async (data: formType) => {
    try {
      console.log("Form submitted:", data);
      
      if (!isAuthenticated) {
        toast.error("Please login to place an order");
        router.push('/pages/account/login?redirect=checkout');
        return;
      }

      if (cartItems.length === 0) {
        toast.error("Your cart is empty");
        return;
      }
      
      setProcessingPayment(true);
      
      // Always process with Razorpay
      handleRazorpayPayment(data);
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Error processing payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  const setStateFromInput = (event) => {
    obj[event.target.name] = event.target.value;
    setObj(obj);
  };

  if (loading) {
    return (
      <>
        <Breadcrumb title="checkout" parent="home" />
        <div className="section-big-py-space bg-light">
          <div className="container text-center py-5">
            <Spinner color="primary" />
            <p className="mt-3">Loading checkout...</p>
          </div>
        </div>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <Breadcrumb title="checkout" parent="home" />
        <div className="section-big-py-space bg-light">
          <div className="container py-5">
            <Alert color="warning">
              <h4>Authentication Required</h4>
              <p>{authError}</p>
              <p>Redirecting to login page...</p>
              <Link href="/pages/account/login?redirect=checkout">
                <button className="btn btn-primary mt-3">Login Now</button>
              </Link>
            </Alert>
          </div>
        </div>
      </>
    );
  }

  if (processingPayment) {
    return (
      <>
        <Breadcrumb title="checkout" parent="home" />
        <div className="section-big-py-space bg-light">
          <div className="container text-center py-5">
            <Spinner color="primary" />
            <p className="mt-3">Processing payment...</p>
            <p className="text-muted">Please do not close this window</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title="checkout" parent="home" />
      {/* <!-- section start --> */}
      <section className="section-big-py-space bg-light">
        <div className="custom-container">
          <div className="checkout-page contact-page">
            <div className="checkout-form">
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Row>
                  <Col lg="6" sm="12" xs="12">
                    <div className="checkout-title">
                      <h3>Billing Details</h3>
                    </div>
                    <div className="theme-form">
                      <Row className="check-out ">
                        <FormGroup className="col-md-6 col-sm-6 col-xs-12">
                          <Label>First Name</Label>
                          <input
                            type="text"
                            {...register("firstName", { required: true })}
                            name="firstName"
                            placeholder=""
                            className={`${errors.firstName ? "error_border" : ""}`}
                            id="firstName"
                          />
                          <span className="error-message">{errors.firstName && "First name is required"}</span>
                        </FormGroup>
                        <FormGroup className="col-md-6 col-sm-6 col-xs-12">
                          <Label>Last Name</Label>
                          <input
                            type="text"
                            className={`${errors.lastName ? "error_border" : ""}`}
                            id="lastName"
                            name="lastName"
                            placeholder=""
                            {...register("lastName", { required: true })}
                          />
                          <span className="error-message">{errors.lastName && "Last name is required"}</span>
                        </FormGroup>
                        <FormGroup className="col-md-6 col-sm-6 col-xs-12">
                          <Label className="field-label">Phone</Label>
                          <input 
                            type="text" 
                            className={`${errors.phone ? "error_border" : ""}`} 
                            id="phone" 
                            name="phone" 
                            placeholder="" 
                            {...register("phone", { pattern: /\d+/, required: true })} 
                          />
                          <span className="error-message">{errors.phone && "Please enter a valid phone number"}</span>
                        </FormGroup>
                        <FormGroup className="col-md-6 col-sm-6 col-xs-12">
                          <Label className="field-label">Email Address</Label>
                          <input
                            type="text"
                            className={`${errors.email ? "error_border" : ""}`}
                            name="email"
                            placeholder=""
                            id="email"
                            {...register("email", {
                              required: true,
                              pattern: /^\S+@\S+$/i,
                            })}
                          />
                          <span className="error-message">{errors.email && "Please enter a valid email address"}</span>
                        </FormGroup>
                        <FormGroup className="col-md-12 col-sm-12 col-xs-12">
                          <Label className="field-label">Country</Label>
                          <select id="country" name="country" {...register("country", { required: true })}>
                            <option>India</option>
                            <option>South Africa</option>
                            <option>United State</option>
                            <option>Australia</option>
                          </select>
                        </FormGroup>
                        <FormGroup className="col-md-12 col-sm-12 col-xs-12">
                          <Label className="field-label">Address</Label>
                          <input
                            type="text"
                            name="address"
                            id="address"
                            placeholder="Street address"
                            className={`${errors.address ? "error_border" : ""}`}
                            {...register("address", {
                              required: true,
                              min: 5,
                              max: 120,
                            })}
                          />
                          <span className="error-message">{errors.address && "Please enter your address"}</span>
                        </FormGroup>
                        <FormGroup className="col-md-12 col-sm-12 col-xs-12">
                          <Label className="field-label">Apartment/Suite (Optional)</Label>
                          <input
                            type="text"
                            name="apartment"
                            id="apartment"
                            placeholder="Apartment, suite, unit, etc."
                            {...register("apartment")}
                          />
                        </FormGroup>
                        <FormGroup className="col-md-12 col-sm-12 col-xs-12">
                          <Label className="field-label">Town/City</Label>
                          <input
                            type="text"
                            className={`${errors.city ? "error_border" : ""}`}
                            id="city"
                            name="city"
                            {...register("city", { required: true })}
                            placeholder=""
                            onChange={setStateFromInput}
                          />
                          <span className="error-message">{errors.city && "City is required"}</span>
                        </FormGroup>
                        <FormGroup className="col-md-12 col-sm-6 col-xs-12">
                          <Label className="field-label">State / County</Label>
                          <input
                            type="text"
                            className={`${errors.state ? "error_border" : ""}`}
                            name="state"
                            {...register("state", { required: true })}
                            onChange={setStateFromInput}
                            id="state"
                            placeholder=""
                          />
                          <span className="error-message">{errors.state && "State is required"}</span>
                        </FormGroup>
                        <FormGroup className="col-md-12 col-sm-6 col-xs-12">
                          <Label className="field-label">Postal Code</Label>
                          <input
                            type="text"
                            name="pincode"
                            className={`${errors.pincode ? "error_border" : ""}`}
                            {...register("pincode", { pattern: /\d+/, required: true })}
                            id="pincode"
                            placeholder=""
                          />
                          <span className="error-message">{errors.pincode && "Required integer"}</span>
                        </FormGroup>
                      </Row>
                    </div>
                  </Col>
                  <Col lg="6" sm="12" xs="12">
                    <div className="checkout-details theme-form section-big-mt-space">
                      {cartItems && cartItems.length > 0 ? (
                        <div className="order-box">
                          <div className="title-box">
                            <div>
                              Product <span>Total</span>
                            </div>
                          </div>
                          <ul className="qty">
                            {cartItems.map((item, index) => (
                              <li key={index}>
                                {item.title} × {item.qty}{" "}
                                <span>
                                  {symbol}
                                  {item.total * value}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <ul className="sub-total">
                            <li>
                              Subtotal{" "}
                              <span className="count">
                                {symbol}
                                {(cartTotal * value).toFixed(2)}
                              </span>
                            </li>
                            <li>
                              Shipping
                              <div className="shipping">
                                <div className="shopping-option">
                                  <input type="checkbox" name="free-shipping" id="free-shipping" defaultChecked />
                                  <label htmlFor="free-shipping">Free Shipping</label>
                                </div>
                              </div>
                            </li>
                          </ul>
                          <ul className="total">
                            <li>
                              Total{" "}
                              <span className="count">
                                {symbol}
                                {(cartTotal * value).toFixed(2)}
                              </span>
                            </li>
                          </ul>
                          <div className="payment-box">
                            <div className="upper-box">
                              <div className="payment-options">
                                <ul>
                                  <li>
                                    <div className="radio-option">
                                      <input 
                                        type="radio" 
                                        name="payment-group" 
                                        id="payment-1" 
                                        defaultChecked={payment === "razorpay"} 
                                      />
                                      <label htmlFor="payment-1">
                                        Razorpay
                                        <span className="small-text">
                                          Pay securely with Razorpay - Credit/Debit cards, UPI, and more payment options.
                                        </span>
                                      </label>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            <div className="text-right">
                              <button type="submit" className="btn-normal btn">
                                Pay & Place Order
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <p>Your cart is empty</p>
                          <Link href="/collections/leftsidebar">
                            <button className="btn btn-primary mt-2">Continue Shopping</button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        </div>
      </section>
      {/* <!-- section end --> */}
    </>
  );
};

export default CheckoutPage;
