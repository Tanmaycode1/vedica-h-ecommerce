# BigDeal E-commerce API Documentation

This document provides detailed information about the REST API endpoints available in the BigDeal E-commerce platform.

## Base URL

```
http://localhost:3002/api
```

## Authentication

Authentication is handled using JSON Web Tokens (JWT). To access protected endpoints, include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

### Auth Endpoints

#### Register User

```
POST /auth/register
```

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

#### Login User

```
POST /auth/login
```

Request body:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

#### Get User Profile

```
GET /auth/profile
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Response:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "created_at": "2023-07-10T12:00:00Z"
}
```

#### Firebase Authentication

```
GET /auth/firebase/profile
```

Headers:
```
Authorization: Bearer your_firebase_token_here
```

Response: Same as regular profile endpoint

## Products

### Get All Products

```
GET /products
```

Query parameters:

| Parameter | Type    | Description                                       |
|-----------|---------|---------------------------------------------------|
| page      | Integer | Page number (default: 1)                          |
| limit     | Integer | Number of items per page (default: 10)            |
| type      | String  | Filter by product type                            |
| category  | String  | Filter by category                                |
| brand     | String  | Filter by brand                                   |
| min_price | Number  | Minimum price                                     |
| max_price | Number  | Maximum price                                     |
| search    | String  | Search term to match against title or description |
| is_new    | Boolean | Filter products marked as new                     |
| is_sale   | Boolean | Filter products on sale                           |

Response:
```json
{
  "products": [
    {
      "id": 1,
      "title": "Smartphone X",
      "description": "Latest smartphone with advanced features",
      "type": "electronics",
      "brand": "TechBrand",
      "category": "smartphones",
      "price": 799.99,
      "is_new": true,
      "is_sale": false,
      "discount": 0,
      "stock": 50,
      "images": [
        {
          "id": 1,
          "src": "smartphone-x-1.jpg",
          "alt": "Smartphone X Front View"
        },
        {
          "id": 2,
          "src": "smartphone-x-2.jpg",
          "alt": "Smartphone X Back View"
        }
      ],
      "variants": [
        {
          "id": 1,
          "sku": "SMX-BLK-128",
          "size": null,
          "color": "black",
          "image_id": 1
        },
        {
          "id": 2,
          "sku": "SMX-WHT-128",
          "size": null,
          "color": "white",
          "image_id": 2
        }
      ]
    }
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "total_pages": 10
    }
  }
}
```

### Get Product by ID

```
GET /products/:id
```

Response:
```json
{
  "id": 1,
  "title": "Smartphone X",
  "description": "Latest smartphone with advanced features",
  "type": "electronics",
  "brand": "TechBrand",
  "category": "smartphones",
  "price": 799.99,
  "is_new": true,
  "is_sale": false,
  "discount": 0,
  "stock": 50,
  "images": [
    {
      "id": 1,
      "src": "smartphone-x-1.jpg",
      "alt": "Smartphone X Front View"
    },
    {
      "id": 2,
      "src": "smartphone-x-2.jpg",
      "alt": "Smartphone X Back View"
    }
  ],
  "variants": [
    {
      "id": 1,
      "sku": "SMX-BLK-128",
      "size": null,
      "color": "black",
      "image_id": 1
    },
    {
      "id": 2,
      "sku": "SMX-WHT-128",
      "size": null,
      "color": "white",
      "image_id": 2
    }
  ]
}
```

### Create Product

```
POST /products
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Request body:
```json
{
  "title": "New Product",
  "description": "Product description",
  "type": "electronics",
  "brand": "TechBrand",
  "category": "smartphones",
  "price": 599.99,
  "is_new": true,
  "is_sale": false,
  "discount": 0,
  "stock": 25,
  "images": [
    {
      "src": "product-1.jpg",
      "alt": "Product Image"
    }
  ],
  "variants": [
    {
      "sku": "NP-BLK-64",
      "color": "black",
      "image_id": 1
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": 2,
    "title": "New Product",
    "description": "Product description",
    "type": "electronics",
    "brand": "TechBrand",
    "category": "smartphones",
    "price": 599.99,
    "is_new": true,
    "is_sale": false,
    "discount": 0,
    "stock": 25,
    "images": [
      {
        "id": 3,
        "src": "product-1.jpg",
        "alt": "Product Image"
      }
    ],
    "variants": [
      {
        "id": 3,
        "sku": "NP-BLK-64",
        "color": "black",
        "image_id": 3
      }
    ]
  }
}
```

### Update Product

```
PUT /products/:id
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Request body: Same format as Create Product

Response:
```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "id": 2,
    "title": "Updated Product",
    "description": "Updated description",
    "type": "electronics",
    "brand": "TechBrand",
    "category": "smartphones",
    "price": 649.99,
    "is_new": true,
    "is_sale": true,
    "discount": 10,
    "stock": 20,
    "images": [
      {
        "id": 3,
        "src": "product-1.jpg",
        "alt": "Product Image"
      }
    ],
    "variants": [
      {
        "id": 3,
        "sku": "NP-BLK-64",
        "color": "black",
        "image_id": 3
      }
    ]
  }
}
```

### Delete Product

```
DELETE /products/:id
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Response:
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Get Product Categories

```
GET /products/categories
```

Response:
```json
{
  "categories": [
    "smartphones",
    "laptops",
    "tablets",
    "accessories",
    "wearables"
  ]
}
```

### Get Product Brands

```
GET /products/brands
```

Response:
```json
{
  "brands": [
    "TechBrand",
    "AppleClone",
    "Samson",
    "Googly",
    "OneMinus"
  ]
}
```

## Collections

### Get All Collections

```
GET /collections
```

Response:
```json
{
  "collections": [
    {
      "id": 1,
      "name": "Featured Products",
      "slug": "featured",
      "description": "Our featured products collection"
    },
    {
      "id": 2,
      "name": "New Arrivals",
      "slug": "new-arrivals",
      "description": "Check out our latest products"
    }
  ]
}
```

### Get Collection by Slug

```
GET /collections/:slug
```

Response:
```json
{
  "id": 1,
  "name": "Featured Products",
  "slug": "featured",
  "description": "Our featured products collection",
  "products": [
    {
      "id": 1,
      "title": "Smartphone X",
      "description": "Latest smartphone with advanced features",
      "type": "electronics",
      "brand": "TechBrand",
      "category": "smartphones",
      "price": 799.99,
      "is_new": true,
      "is_sale": false,
      "discount": 0,
      "stock": 50,
      "images": [
        {
          "id": 1,
          "src": "smartphone-x-1.jpg",
          "alt": "Smartphone X Front View"
        }
      ]
    }
  ]
}
```

### Create Collection

```
POST /collections
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Request body:
```json
{
  "name": "Holiday Sale",
  "slug": "holiday-sale",
  "description": "Special holiday deals",
  "product_ids": [1, 3, 5]
}
```

Response:
```json
{
  "success": true,
  "message": "Collection created successfully",
  "collection": {
    "id": 3,
    "name": "Holiday Sale",
    "slug": "holiday-sale",
    "description": "Special holiday deals"
  }
}
```

### Update Collection

```
PUT /collections/:id
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Request body: Same format as Create Collection

Response:
```json
{
  "success": true,
  "message": "Collection updated successfully",
  "collection": {
    "id": 3,
    "name": "Winter Sale",
    "slug": "winter-sale",
    "description": "Special winter deals"
  }
}
```

### Delete Collection

```
DELETE /collections/:id
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Response:
```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

## Currencies

### Get All Currencies

```
GET /currencies
```

Response:
```json
[
  {
    "currency": "USD",
    "symbol": "$",
    "value": 1
  },
  {
    "currency": "EUR",
    "symbol": "€",
    "value": 0.85
  },
  {
    "currency": "GBP",
    "symbol": "£",
    "value": 0.75
  },
  {
    "currency": "INR",
    "symbol": "₹",
    "value": 73.5
  }
]
```

## Orders

### Get Orders for Current User

```
GET /orders
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Response:
```json
{
  "orders": [
    {
      "id": 1,
      "status": "delivered",
      "total_amount": 799.99,
      "payment_method": "credit_card",
      "shipping_address": "123 Main St, Anytown, AN 12345",
      "created_at": "2023-07-01T12:00:00Z",
      "updated_at": "2023-07-02T15:30:00Z"
    }
  ]
}
```

### Get Order by ID

```
GET /orders/:id
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Response:
```json
{
  "id": 1,
  "status": "delivered",
  "total_amount": 799.99,
  "payment_method": "credit_card",
  "shipping_address": "123 Main St, Anytown, AN 12345",
  "created_at": "2023-07-01T12:00:00Z",
  "updated_at": "2023-07-02T15:30:00Z",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "title": "Smartphone X",
      "quantity": 1,
      "price": 799.99,
      "image": "smartphone-x-1.jpg"
    }
  ]
}
```

### Create Order

```
POST /orders
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Request body:
```json
{
  "shipping_address": "123 Main St, Anytown, AN 12345",
  "payment_method": "credit_card",
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 2,
    "status": "pending",
    "total_amount": 799.99,
    "payment_method": "credit_card",
    "shipping_address": "123 Main St, Anytown, AN 12345",
    "created_at": "2023-07-10T12:00:00Z",
    "updated_at": "2023-07-10T12:00:00Z",
    "items": [
      {
        "id": 2,
        "product_id": 1,
        "title": "Smartphone X",
        "quantity": 1,
        "price": 799.99,
        "image": "smartphone-x-1.jpg"
      }
    ]
  }
}
```

### Update Order Status

```
PUT /orders/:id/status
```

Headers:
```
Authorization: Bearer your_jwt_token_here
```

Request body:
```json
{
  "status": "shipped"
}
```

Response:
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "id": 2,
    "status": "shipped",
    "updated_at": "2023-07-11T10:30:00Z"
  }
}
```

## Error Responses

All API endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "error": true,
  "message": "Invalid request parameters",
  "details": {
    "field": "Specific error message for this field"
  }
}
```

### 401 Unauthorized

```json
{
  "error": true,
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": true,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found

```json
{
  "error": true,
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": true,
  "message": "Internal server error"
}
```

## Rate Limiting

To prevent abuse, the API implements rate limiting:

- 100 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

When the rate limit is exceeded, the API returns a 429 Too Many Requests response:

```json
{
  "error": true,
  "message": "Rate limit exceeded. Try again in X seconds"
}
``` 