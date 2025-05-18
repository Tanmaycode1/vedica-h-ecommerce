# BigDeal E-commerce Backend Documentation

This document provides an overview of the backend implementation for the BigDeal E-commerce platform.

## Architecture Overview

The backend is built using Node.js with Express and follows a RESTful API architecture. It is designed to support the BigDeal React frontend, providing data management, authentication, and other core e-commerce functionality.

## Tech Stack

- **Runtime Environment**: Node.js
- **Web Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT and Firebase Authentication
- **Language**: TypeScript
- **API Documentation**: Swagger

## Directory Structure

```
backend/
├── config/           # Configuration files
├── controllers/      # Route handlers and business logic
├── db/               # Database-related files
│   ├── migrations/   # Database schema migrations
│   └── seeds/        # Seed data for the database
├── middleware/       # Custom middleware functions
├── models/           # Data models
├── routes/           # API route definitions
├── services/         # Business logic services
├── types/            # TypeScript type definitions
├── uploads/          # File upload directory
└── utils/            # Utility functions
```

## API Endpoints

The API follows RESTful conventions and is organized into the following resource groups:

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `GET /api/auth/profile` - Get current user profile (requires authentication)
- `GET /api/auth/firebase/profile` - Get current user profile with Firebase auth

### Products

- `GET /api/products` - List all products with optional filtering
- `GET /api/products/:id` - Get product details by ID
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/:id` - Update a product (admin only)
- `DELETE /api/products/:id` - Delete a product (admin only)
- `GET /api/products/categories` - Get all product categories
- `GET /api/products/brands` - Get all product brands

### Collections

- `GET /api/collections` - List all collections
- `GET /api/collections/:slug` - Get a collection by slug
- `POST /api/collections` - Create a new collection (admin only)
- `PUT /api/collections/:id` - Update a collection (admin only)
- `DELETE /api/collections/:id` - Delete a collection (admin only)

### Orders

- `GET /api/orders` - List all orders for current user
- `GET /api/orders/:id` - Get order details by ID
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id/status` - Update order status (admin only)

### Currencies

- `GET /api/currencies` - List all supported currencies

## Authentication Implementation

The backend supports two authentication methods:

1. **JWT Authentication**: Uses JSON Web Tokens for stateless authentication
   - Implemented in `middleware/authenticate.ts`
   - Token expiration is configured via environment variables

2. **Firebase Authentication**: Alternative authentication method
   - Allows the frontend to use Firebase Auth
   - Verified server-side using Firebase Admin SDK

Both methods are integrated into the auth routes with appropriate middleware:

```typescript
// Example from auth.routes.ts
router.get('/profile', authenticateJWT as express.RequestHandler, authController.getProfile);
router.get('/firebase/profile', authenticateFirebase as express.RequestHandler, authController.getProfile);
```

## Database Schema

The database uses PostgreSQL with the following core tables:

### Users
- id (Primary Key)
- email
- password (hashed)
- name
- role (user/admin)
- created_at
- updated_at

### Products
- id (Primary Key)
- title
- description
- type
- brand
- category
- price
- is_new
- is_sale
- discount
- stock
- created_at
- updated_at

### Collections
- id (Primary Key)
- name
- slug
- description
- created_at
- updated_at

### Collection_Products
- collection_id (Foreign Key)
- product_id (Foreign Key)

### Orders
- id (Primary Key)
- user_id (Foreign Key)
- total_amount
- status
- shipping_address
- payment_method
- created_at
- updated_at

### Order_Items
- id (Primary Key)
- order_id (Foreign Key)
- product_id (Foreign Key)
- quantity
- price
- created_at
- updated_at

### Currencies
- code (Primary Key)
- name
- symbol
- value (exchange rate)
- is_default

## Environment Configuration

The backend uses environment variables for configuration, defined in `.env` files. See `.env.example` for required variables:

- Server configuration (PORT, NODE_ENV)
- Database connection details
- JWT secret and expiration
- File upload settings
- Firebase configuration

## Error Handling

The API implements consistent error handling with appropriate HTTP status codes:
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 500 - Internal Server Error

Errors are returned in a consistent format:
```json
{
  "error": true,
  "message": "Error description",
  "details": {} // Optional additional information
}
```

## File Uploads

The backend supports file uploads for product images:
- Files are stored in the `uploads` directory
- File size limits are enforced
- Supported formats: JPEG, PNG, WebP

## Development and Deployment

### Development

```bash
# Install dependencies
npm install

# Create database and run migrations
npm run db:migrate

# Seed the database with test data
npm run db:seed

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Integration with Frontend

The backend is designed to work with the BigDeal React frontend. The frontend makes API calls to this backend using the fetch API or Axios. The migration from Apollo GraphQL to REST API has been implemented while maintaining backward compatibility.

## Security Considerations

The backend implements various security measures:
- Password hashing using bcrypt
- JWT for secure authentication
- CORS configuration to prevent unauthorized domains from accessing the API
- Input validation to prevent injection attacks
- Rate limiting to prevent brute force attacks

## Future Improvements

Planned enhancements for the backend:
- Implement refresh tokens for authentication
- Add Redis for caching
- Set up CI/CD pipeline
- Implement webhooks for integrations
- Add support for payment gateways 