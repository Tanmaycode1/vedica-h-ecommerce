/**
 * API Service to handle REST API calls
 * This replaces the GraphQL functionality with direct REST API calls
 */

// Allow configurable base URL with a fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Ensure the API base URL has /api at the end if not already included
const getApiUrl = (url) => {
  if (!url) return 'http://localhost:3002/api';
  
  // If URL already ends with /api, return it
  if (url.endsWith('/api')) return url;
  
  // Otherwise, add /api at the end
  return url.endsWith('/') ? `${url}api` : `${url}/api`;
};

// API URL with /api at the end
const API_URL = getApiUrl(API_BASE_URL);

// Helper to check if a token is still valid
const checkAuth = async () => {
  try {
    // Import Firebase dynamically to avoid SSR issues
    const firebase = (await import('../config/base')).default;
    
    if (!firebase?.currentUser) {
      console.warn('No Firebase user is currently authenticated');
      return null;
    }
    
    // Force refresh the token to ensure it's valid
    const token = await firebase.currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return null;
  }
};

// Generic fetch wrapper with error handling
const fetchData = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Generic fetch with custom headers and full response handling
const fetchWithHeaders = async (endpoint, options = {}) => {
  try {
    console.log(`Making API request to: ${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // If the response is not JSON, handle it accordingly
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn(`Non-JSON response from ${endpoint}:`, text);
      data = { message: text || "No response body" };
    }
    
    return {
      ...data,
      status: response.status,
      success: response.ok,
      statusText: response.statusText
    };
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    return {
      error: error.message,
      status: 500,
      success: false,
      message: "Network or server error"
    };
  }
};

// Helper to transform product data from backend format to frontend format
const transformProductData = (product) => {
  if (!product) return null;
  
  // Format the product data to match the expected structure in the frontend
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    type: product.type,
    brand: product.brand,
    category: product.category,
    price: product.price,
    new: product.is_new, // Convert is_new to new
    sale: product.is_sale, // Convert is_sale to sale
    featured: product.is_featured, // Convert is_featured to featured
    discount: product.discount || 0,
    stock: product.stock || 10,
    // Format images to match frontend structure
    images: Array.isArray(product.images) 
      ? product.images
          .filter((img) => img && img.id !== null)
          .map((img) => {
            // Format the image src path
            let src = img.src;
            
            // Check if it's a database-stored path (product-images) or a seed path (fashion/product)
            if (src && src.startsWith('/product-images/')) {
              src = `/uploads${src}`;
            }
            
            return {
              alt: img.alt || product.title,
              src: src
            };
          })
      : [],
    // Format variants to match frontend structure
    variants: Array.isArray(product.variants) 
      ? product.variants
          .filter((v) => v && v.id !== null)
          .map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            image_id: v.image_id,
            image_url: v.image_url
          }))
      : [],
    // Format collections to match frontend structure
    collection: Array.isArray(product.collections) 
      ? product.collections
          .filter((c) => c && c.id !== null)
          .map((c) => ({
            collectionName: c.name
          }))
      : []
  };
};

// Helper to transform collection data including image URLs
const transformCollectionData = (data) => {
  if (!data) return null;
  
  // Extract collection from response if nested
  const collection = data.collection || data;
  
  // Fix image url if it exists
  if (collection.image_url) {
    // If the image url doesn't include /uploads and is not an absolute URL
    if (!collection.image_url.startsWith('/uploads') && 
        !collection.image_url.startsWith('http')) {
      collection.image_url = `/uploads${collection.image_url}`;
    }
  }
  
  return collection;
};

// API endpoints
const apiService = {
  // Helper function for authenticated requests
  fetchWithHeaders,
  checkAuth,
  
  // Auth endpoints
  getUserProfile: async (firebaseToken) => {
    return fetchWithHeaders('/auth/firebase/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
  },
  
  updateUserProfile: async (userData, firebaseToken) => {
    return fetchWithHeaders('/auth/firebase/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`
      },
      body: JSON.stringify(userData)
    });
  },
  
  // User orders
  getUserOrders: async (firebaseToken) => {
    if (!firebaseToken) {
      console.warn('No token provided to getUserOrders');
      const token = await checkAuth();
      if (!token) {
        return { 
          success: false, 
          status: 401, 
          message: 'Authentication required' 
        };
      }
      firebaseToken = token;
    }

    console.log('Getting orders with token length:', firebaseToken.length);
    
    return fetchWithHeaders('/orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
  },
  
  getOrderById: async (orderId, firebaseToken) => {
    if (!firebaseToken) {
      console.warn('No token provided to getOrderById');
      const token = await checkAuth();
      if (!token) {
        return { 
          success: false, 
          status: 401, 
          message: 'Authentication required' 
        };
      }
      firebaseToken = token;
    }
    
    return fetchWithHeaders(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    });
  },
  
  createOrder: async (orderData, firebaseToken) => {
    if (!firebaseToken) {
      console.warn('No token provided to createOrder');
      const token = await checkAuth();
      if (!token) {
        return { 
          success: false, 
          status: 401, 
          message: 'Authentication required' 
        };
      }
      firebaseToken = token;
    }
    
    console.log('Creating order with payment details:', 
      orderData.payment_details ? JSON.stringify({
        razorpay_order_id: orderData.payment_details.razorpay_order_id,
        razorpay_payment_id: orderData.payment_details.razorpay_payment_id,
        status: orderData.payment_details.status
      }) : 'No payment details');
    
    try {
      const response = await fetchWithHeaders('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify(orderData)
      });
      
      // Ensure order ID is easily accessible in a consistent format
      if (response.success && response.order) {
        console.log('Order created successfully:', JSON.stringify({
          order_id: response.order.id,
          status: response.order.status,
          payment_status: response.order.payment_status
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        status: 500,
        message: error.message || 'Error creating order'
      };
    }
  },
  
  // Mega Menu
  getMegaMenu: () => fetchData('/megamenu'),
  getMegaMenuTree: () => fetchData('/megamenu/tree'),
  
  // Products
  getProducts: (params = {}) => {
    // Prefer new filter API if available
    let queryString = '';
    if (Object.keys(params).length > 0) {
      queryString = '?' + new URLSearchParams(params).toString();
    }
    return fetchData(`/filter/products${queryString}`);
  },
  
  getProductById: async (id) => {
    const response = await fetchData(`/products/${id}`);
    
    // If the response has a product property, use that, otherwise use the response itself
    const productData = response.product || response;
    
    // Transform the product data to match the expected structure
    return transformProductData(productData);
  },
  
  getProductCategories: () => fetchData('/filter/categories'),
  
  getProductBrands: (params = {}) => {
    let queryString = '';
    if (Object.keys(params).length > 0) {
      queryString = '?' + new URLSearchParams(params).toString();
    }
    return fetchData(`/filter/brands${queryString}`);
  },
  
  getProductColors: (params = {}) => {
    let queryString = '';
    if (Object.keys(params).length > 0) {
      queryString = '?' + new URLSearchParams(params).toString();
    }
    return fetchData(`/filter/colors${queryString}`);
  },
  
  // Collections
  getCollections: async () => {
    const collections = await fetchData('/collections');
    return Array.isArray(collections) 
      ? collections.map(transformCollectionData) 
      : [];
  },
  getCollectionsTree: (params = {}) => {
    let queryString = '';
    if (Object.keys(params).length > 0) {
      queryString = '?' + new URLSearchParams(params).toString();
    }
    return fetchData(`/collections/tree${queryString}`);
  },
  getCollectionBySlug: async (slug) => {
    const response = await fetchData(`/collections/by-slug/${slug}`);
    return transformCollectionData(response);
  },
  getFeaturedBrands: () => fetchData('/collections/featured-brands'),
  
  // Currency
  getCurrencies: () => fetchData('/currencies'),
  
  // Payment endpoints
  logPayment: async (paymentData, firebaseToken) => {
    if (!firebaseToken) {
      const token = await checkAuth();
      if (!token) {
        return { success: false, status: 401, message: 'Authentication required' };
      }
      firebaseToken = token;
    }
    
    return fetchWithHeaders('/payments/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`
      },
      body: JSON.stringify(paymentData)
    });
  },
  
  verifyPayment: async (paymentData, firebaseToken) => {
    if (!firebaseToken) {
      const token = await checkAuth();
      if (!token) {
        return { success: false, status: 401, message: 'Authentication required' };
      }
      firebaseToken = token;
    }
    
    return fetchWithHeaders('/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`
      },
      body: JSON.stringify(paymentData)
    });
  },
};

export default apiService; 