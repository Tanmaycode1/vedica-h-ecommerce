// Get the API URL from environment variables
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// API endpoints
export const ENDPOINTS = {
  PRODUCTS: `${API_URL}/products`,
  UPLOADS: `${API_URL}/uploads`,
  AUTH: `${API_URL}/auth`,
} as const; 