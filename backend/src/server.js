const express = require('express');
const cors = require('cors');

// Sample data
const products = [
  {
    id: 1,
    title: 'Test Product 1',
    description: 'This is a test product',
    price: 99.99,
    is_new: true,
    is_sale: false,
    discount: 0,
    stock: 10,
    images: [
      {
        id: 1,
        alt: 'Test Product 1',
        src: 'https://via.placeholder.com/300',
        is_primary: true
      }
    ],
    variants: []
  },
  {
    id: 2,
    title: 'Test Product 2',
    description: 'This is another test product',
    price: 149.99,
    is_new: false,
    is_sale: true,
    discount: 10,
    stock: 5,
    images: [
      {
        id: 2,
        alt: 'Test Product 2',
        src: 'https://via.placeholder.com/300',
        is_primary: true
      }
    ],
    variants: []
  }
];

const collections = [
  {
    id: 1,
    name: 'Test Collection 1',
    slug: 'test-collection-1',
    description: 'This is a test collection'
  },
  {
    id: 2,
    name: 'Test Collection 2',
    slug: 'test-collection-2',
    description: 'This is another test collection'
  }
];

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Test server is running' });
});

// Simple products route
app.get('/api/products', (req, res) => {
  res.status(200).json({
    products: products,
    pagination: {
      total: products.length,
      page: 1,
      limit: 10,
      pages: 1
    }
  });
});

// Categories and brands (these need to come BEFORE the :id route)
app.get('/api/products/categories', (req, res) => {
  res.status(200).json(['Category 1', 'Category 2', 'Category 3']);
});

app.get('/api/products/brands', (req, res) => {
  res.status(200).json(['Brand 1', 'Brand 2', 'Brand 3']);
});

// Get product by ID (this must come AFTER any /api/products/ specific routes)
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  res.status(200).json(product);
});

// Simple collections route
app.get('/api/collections', (req, res) => {
  res.status(200).json(collections);
});

// Get collection by slug
app.get('/api/collections/:slug', (req, res) => {
  const collectionSlug = req.params.slug;
  const collection = collections.find(c => c.slug === collectionSlug);
  
  if (!collection) {
    return res.status(404).json({ message: 'Collection not found' });
  }
  
  // Return collection with associated products
  res.status(200).json({
    collection: collection,
    products: products.slice(0, 2) // Just return all products for the test server
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
  console.log(`API is available at http://localhost:${PORT}/api`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
}); 