import axios from 'axios';

// Get the API URL from environment variables, fallback to localhost if not set
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token for requests (to be used after login)
export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }
};

// Initialize token from localStorage (on client-side)
export const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAuthToken(token);
    }
  }
};

// Call initializeAuth immediately
if (typeof window !== 'undefined') {
  initializeAuth();
}

// Set up request interceptor for handling auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', {
        url: error.config.url,
        method: error.config.method,
        status: error.response.status,
        statusText: error.response.statusText,
        message: error.message,
        data: error.response.data
      });
      
      // If we get a 401, clear the token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add any provided params to the query string
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      
      const response = await api.get(`/products?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  getAllWithoutPagination: async () => {
    try {
      const response = await api.get('/products?all=true');
      return response.data;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  },
  
  getById: async (id: number) => {
    try {
      console.log(`Fetching product with ID: ${id}`);
      const response = await api.get(`/products/${id}`);
      const data = response.data.product;
      
      // Log detailed information about variants and their images
      if (data && data.variants) {
        console.log(`Product ${id} has ${data.variants.length} variants`);
        data.variants.forEach((v: any, i: number) => {
          console.log(`Variant ${i}: Size=${v.size}, Color=${v.color}, ImageID=${v.image_id}, ImageURL=${v.image_url}`);
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching product ID ${id}:`, error);
      throw error;
    }
  },
  
  create: async (productData: any) => {
    try {
      console.log('Creating product with data:', productData);
      
      // Ensure we're using category and not type
      const cleanedData = { ...productData };
      
      // Delete type if it exists, as we're now using category
      if ('type' in cleanedData) {
        delete cleanedData.type;
      }
      
      const response = await api.post('/products', cleanedData);
      console.log('Create product response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  addVariants: async (productId: number, variants: any[]) => {
    try {
      console.log(`Adding variants to product ${productId}:`, variants);
      const response = await api.post(`/products/${productId}/variants`, variants);
      console.log('Add variants response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding variants:', error);
      throw error;
    }
  },
  
  update: async (id: number, productData: any) => {
    try {
      console.log(`Updating product with ID: ${id}`, JSON.stringify(productData, null, 2));
      
      // Ensure we're using category and not type
      const cleanedData = { ...productData };
      
      // Delete type if it exists, as we're now using category
      if ('type' in cleanedData) {
        delete cleanedData.type;
      }
      
      // Verify variant data before sending
      if (cleanedData.variants) {
        console.log('Sending variants with the following image_url values:');
        cleanedData.variants.forEach((v: any, i: number) => {
          console.log(`Variant ${i}: ${v.size} ${v.color} - image_url: ${v.image_url}`);
        });
      }
      
      // First update the basic product information
      const response = await api.put(`/products/${id}`, cleanedData);
      
      console.log('Update product response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id: number) => {
    try {
      console.log(`Deleting product with ID: ${id}`);
      const response = await api.delete(`/products/${id}`);
      console.log('Delete product response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ID ${id}:`, error);
      throw error;
    }
  },
  
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories');
      
      if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data)) {
        return { categories: response.data };
      } else {
        console.warn('No categories found in API response, using fallback');
        return { 
          categories: ['electronics', 'clothing', 'accessories', 'home', 'beauty', 'sports'] 
        };
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { 
        categories: ['electronics', 'clothing', 'accessories', 'home', 'beauty', 'sports'] 
      };
    }
  },
  
  getBrands: async () => {
    try {
      const response = await api.get('/products/brands');
      
      if (response.data && response.data.brands && Array.isArray(response.data.brands)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data)) {
        return { brands: response.data };
      } else {
        console.warn('No brands found in API response, using fallback');
        return { 
          brands: ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Zara', 'H&M'] 
        };
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      return { 
        brands: ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Zara', 'H&M'] 
      };
    }
  },
  
  getColors: async () => {
    const response = await api.get('/products/colors');
    return response.data;
  },
  
  addToCollections: async (productId: number, collectionIds: number[]) => {
    try {
      console.log(`[DEBUG] Adding product ${productId} to collections:`, collectionIds);
      
      // First update the product with collections directly from the backend
      console.log(`[DEBUG] Sending PUT request to /products/${productId}/collections with data:`, { collections: collectionIds });
      const updateResponse = await api.put(`/products/${productId}/collections`, { 
        collections: collectionIds 
      });
      
      return updateResponse.data;
    } catch (error) {
      console.error(`[DEBUG] Error in addToCollections:`, error);
      throw error;
    }
  },
  
  updateCollections: async (productId: number, collectionIds: number[]) => {
    try {
      console.log(`[DEBUG] Updating collections for product ${productId}:`, collectionIds);
      
      // First, get current product data to see what collections it's already in
      let currentCollectionIds: number[] = [];
      try {
        const productData = await productsApi.getById(productId);
        if (productData && productData.collections && Array.isArray(productData.collections)) {
          currentCollectionIds = productData.collections.map((c: any) => c.id);
        }
      } catch (err) {
        console.warn('[DEBUG] Could not get current product collections, proceeding with update anyway:', err);
      }
      
      console.log(`[DEBUG] Current collections for product ${productId}:`, currentCollectionIds);
      
      // Use dedicated endpoint for updating collections
      console.log(`[DEBUG] Sending PUT request to /products/${productId}/collections with data:`, { collections: collectionIds });
      
      // Try to use the direct debug test endpoint instead if possible
      try {
        console.log(`[DEBUG] Attempting to use direct debug test endpoint for more reliable update`);
        // Fallback to using fetch directly to the debug endpoint
        const debugResponse = await fetch(`${BASE_URL}/products/debug/add-to-collections/${productId}/${collectionIds.join(',')}`);
        const debugResult = await debugResponse.json();
        console.log(`[DEBUG] Debug endpoint response:`, debugResult);
        
        // If debug endpoint worked, we can proceed with normal API call as well
        console.log(`[DEBUG] Debug endpoint successful, proceeding with regular API call`);
      } catch (debugErr) {
        console.error(`[DEBUG] Error with debug endpoint:`, debugErr);
        // Fall back to regular endpoint below
      }
      
      const response = await api.put(`/products/${productId}/collections`, { 
        collections: collectionIds 
      });
      
      console.log('[DEBUG] Update collections response:', JSON.stringify(response.data));
      
      // Calculate collections to add (that weren't already there)
      const collectionsToAdd = collectionIds.filter(id => !currentCollectionIds.includes(id));
      
      // For extra reliability, also ensure each collection has this product
      if (collectionsToAdd.length > 0) {
        console.log(`[DEBUG] Ensuring new collections have product ${productId}:`, collectionsToAdd);
        await Promise.all(collectionsToAdd.map(async (collectionId) => {
          try {
            console.log(`[DEBUG] Adding product ${productId} to collection ${collectionId} directly`);
            const result = await collectionsApi.addProduct(collectionId, productId);
            console.log(`[DEBUG] Result of adding to collection ${collectionId}:`, JSON.stringify(result));
          } catch (error) {
            // Already in collection is fine, other errors log but continue
            console.warn(`[DEBUG] Failed to add product ${productId} to collection ${collectionId}:`, error);
          }
        }));
      }
      
      // Verify the collections were actually updated by fetching the product
      try {
        console.log(`[DEBUG] Verifying collections for product ${productId} after update`);
        const updatedProduct = await productsApi.getById(productId);
        const updatedCollections = updatedProduct.collections || [];
        console.log(`[DEBUG] Product now has collections:`, updatedCollections.map((c: any) => c.id));
        
        // Check if all requested collections are there
        const missingCollections = collectionIds.filter(id => 
          !updatedCollections.some((c: any) => c.id === id)
        );
        
        if (missingCollections.length > 0) {
          console.error(`[DEBUG] Some collections are still missing after update: ${missingCollections.join(', ')}`);
        } else {
          console.log(`[DEBUG] All collections successfully updated!`);
        }
      } catch (err) {
        console.error(`[DEBUG] Failed to verify collections after update:`, err);
      }
      
      return response.data;
    } catch (error) {
      console.error(`[DEBUG] Error in updateCollections:`, error);
      throw error;
    }
  }
};

// Define a collection type
interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  products?: any[];
  products_count?: number;
  is_featured?: boolean;
  parent_id?: number | null;
  collection_type?: string;
  level?: number;
  is_active?: boolean;
  image_url?: string;
  children?: Collection[];
  [key: string]: any;
}

// Collections API
export const collectionsApi = {
  getAll: async () => {
    try {
      console.log('Fetching all collections');
      const response = await api.get('/collections');
      console.log('Collections response:', response.data);
      
      let collections: Collection[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        collections = response.data.map((collection: Collection) => ({
          ...collection,
          products_count: collection.products_count || 
                         (collection.products && Array.isArray(collection.products) ? collection.products.length : 0)
        }));
      } else if (response.data && response.data.collections && Array.isArray(response.data.collections)) {
        collections = response.data.collections.map((collection: Collection) => ({
          ...collection,
          products_count: collection.products_count || 
                         (collection.products && Array.isArray(collection.products) ? collection.products.length : 0)
        }));
      }
      
      console.log('Processed collections with product counts:', collections);
      return collections;
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  },
  
  getTree: async (params?: { collection_type?: string; include_inactive?: boolean }) => {
    try {
      console.log('Fetching collections tree');
      const queryParams = new URLSearchParams();
      
      if (params?.collection_type) {
        queryParams.append('collection_type', params.collection_type);
      }
      
      if (params?.include_inactive) {
        queryParams.append('include_inactive', 'true');
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await api.get(`/collections/tree${queryString}`);
      
      console.log('Collections tree response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching collections tree:', error);
      throw error;
    }
  },
  
  getBySlug: async (slug: string) => {
    try {
      console.log(`Fetching collection with slug: ${slug}`);
      const response = await api.get(`/collections/${slug}`);
      console.log('Collection by slug response:', response.data);
      
      let collectionData = response.data;
      
      // Add product count if it doesn't exist
      if (collectionData && !collectionData.products_count && collectionData.products) {
        collectionData = {
          ...collectionData,
          products_count: Array.isArray(collectionData.products) ? collectionData.products.length : 0
        };
      }
      
      return collectionData;
    } catch (error) {
      console.error(`Error fetching collection with slug ${slug}:`, error);
      throw error;
    }
  },
  
  create: async (collectionData: any) => {
    try {
      console.log('Creating collection with data:', collectionData);
      const response = await api.post('/collections', collectionData);
      console.log('Create collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  },
  
  update: async (id: number, collectionData: any) => {
    try {
      console.log(`Updating collection with ID: ${id}`, collectionData);
      const response = await api.put(`/collections/${id}`, collectionData);
      console.log('Update collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating collection ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id: number) => {
    try {
      console.log(`Deleting collection with ID: ${id}`);
      const response = await api.delete(`/collections/${id}`);
      console.log('Delete collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting collection ID ${id}:`, error);
      throw error;
    }
  },
  
  addProduct: async (collectionId: number, productId: number) => {
    try {
      console.log(`Adding product ${productId} to collection ${collectionId}`);
      const response = await api.post(`/collections/${collectionId}/products`, { productId });
      console.log('Add product to collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error adding product ${productId} to collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  addProducts: async (collectionId: number, productIds: number[], fullUpdate: boolean = true) => {
    try {
      console.log(`${fullUpdate ? 'Replacing' : 'Adding'} products for collection ${collectionId}:`, productIds);
      const queryParams = fullUpdate ? '?fullUpdate=true' : '';
      const response = await api.post(`/collections/${collectionId}/products/batch${queryParams}`, { productIds });
      console.log('Update products response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating products for collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  removeProduct: async (collectionId: number, productId: number, removeFromParents: boolean = false) => {
    try {
      console.log(`Removing product ${productId} from collection ${collectionId}`);
      const queryParams = removeFromParents ? '?removeFromParents=true' : '';
      const response = await api.delete(`/collections/${collectionId}/products/${productId}${queryParams}`);
      console.log('Remove product from collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error removing product ${productId} from collection ${collectionId}:`, error);
      throw error;
    }
  }
};

// Orders API
export const ordersApi = {
  getAll: async () => {
    try {
      const response = await api.get('/orders/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },
  
  updateStatus: async (id: number, status: string) => {
    try {
      const response = await api.patch(`/orders/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      throw error;
    }
  },
  
  updatePaymentStatus: async (id: number, payment_status: string) => {
    try {
      const response = await api.patch(`/orders/${id}`, { payment_status });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id} payment status:`, error);
      throw error;
    }
  }
};

// Payments API
export const paymentsApi = {
  getPaymentsByOrderId: async (orderId: number) => {
    try {
      const response = await api.get(`/payments/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      // If it's a 404, payments may not exist yet for this order
      if (error?.response?.status === 404) {
        return { success: false, payments: [] };
      }
      console.error(`Error fetching payments for order ${orderId}:`, error);
      throw error;
    }
  },
  
  createPaymentOrder: async (orderId: number) => {
    try {
      const response = await api.post(`/payments/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error creating payment order for order ${orderId}:`, error);
      throw error;
    }
  },
  
  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const response = await api.post('/payments/verify', data);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },
  
  getAllPayments: async () => {
    try {
      const response = await api.get('/payments/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
  }
};

// Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    
    // Set token on successful login
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response.data;
  },
  
  logout: () => {
    setAuthToken('');
  }
};

// Define a mega menu collection type
interface MegaMenuCollection {
  id: number;
  collection_id: number;
  position: number;
  is_active: boolean;
  collection_name?: string;
  collection_slug?: string;
  parent_id?: number | null;
  collection_type?: string;
  level?: number;
  parent_menu_item_id?: number | null;
  display_subcollections?: boolean;
}

// Mega Menu API
export const megaMenuApi = {
  getTree: async () => {
    try {
      console.log('Fetching mega menu tree');
      const response = await api.get('/megamenu/tree');
      console.log('Mega menu response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching mega menu tree:', error);
      throw error;
    }
  },
  
  addCollection: async (collectionId: number, position?: number, parentMenuItemId?: number | null, displaySubcollections: boolean = false) => {
    try {
      console.log(`Adding collection ${collectionId} to mega menu`);
      const response = await api.post('/megamenu', { 
        collection_id: collectionId,
        position,
        parent_menu_item_id: parentMenuItemId,
        display_subcollections: displaySubcollections
      });
      console.log('Add to mega menu response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding collection to mega menu:', error);
      throw error;
    }
  },
  
  addSubcollection: async (collectionId: number, parentMenuItemId: number, position?: number) => {
    try {
      console.log(`Adding subcollection ${collectionId} to parent menu item ${parentMenuItemId}`);
      const response = await api.post('/megamenu/subcollection', { 
        collection_id: collectionId,
        parent_menu_item_id: parentMenuItemId,
        position
      });
      console.log('Add subcollection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding subcollection to mega menu:', error);
      throw error;
    }
  },
  
  updateMenuItem: async (id: number, data: { position?: number; is_active?: boolean; display_subcollections?: boolean }) => {
    try {
      console.log(`Updating mega menu item ${id}:`, data);
      const response = await api.put(`/megamenu/${id}`, data);
      console.log('Update mega menu item response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating mega menu item ${id}:`, error);
      throw error;
    }
  },
  
  removeCollection: async (id: number) => {
    try {
      console.log(`Removing collection from mega menu, item ID: ${id}`);
      const response = await api.delete(`/megamenu/${id}`);
      console.log('Remove from mega menu response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error removing collection from mega menu, item ID: ${id}:`, error);
      throw error;
    }
  },
  
  reorderItems: async (items: Array<{ id: number; position: number }>) => {
    try {
      console.log('Reordering mega menu items:', items);
      const response = await api.post('/megamenu/reorder', { items });
      console.log('Reorder response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error reordering mega menu items:', error);
      throw error;
    }
  }
};

// Analytics API
export const analyticsApi = {
  getDashboardStats: async () => {
    try {
      console.log('Fetching dashboard analytics');
      const response = await api.get('/analytics/dashboard');
      console.log('Dashboard analytics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }
};

export default api; 