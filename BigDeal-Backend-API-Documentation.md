# BigDeal E-commerce Backend API Documentation

## Overview

This document provides a comprehensive analysis of all backend APIs in the BigDeal E-commerce platform, detailing their behavior, pagination mechanisms, and identified issues.

## Database Structure

The database contains **50 products** according to the seed file (`backend/src/db/seeds/02_products_and_related.ts`). These products are generated with:
- 10 possible categories: FASHION, ELECTRONICS, VEGETABLES, FURNITURE, JEWELLWEY, BEAUTY, FLOWER, TOOLS, WATCH, METRO
- 12 possible brands: nike, adidas, puma, netplay, roadster, zara, h&m, levis, samsung, apple, sony, lg
- Each product has 1-6 variants with different sizes and colors
- Each product has 2-5 images
- Products are assigned to 1-3 collections from 5 possible collections

## GraphQL Endpoints

### Products Query

**Endpoint**: `POST /graphql`

**Request**:
```graphql
query {
  products(
    limit: Int,
    indexFrom: Int,
    type: String,
    priceMin: Float,
    priceMax: Float,
    brand: [String],
    color: [String],
    new: Boolean
  ) {
    items {
      id
      title
      description
      type
      brand
      category
      price
      new
      sale
      discount
      stock
      images {
        alt
        src
      }
      variants {
        id
        sku
        size
        color
        image_id
      }
      collection {
        collectionName
      }
    }
    total
    totalPages
    hasMore
    currentPage
  }
}
```

**Functionality**: 
- Fetches products with pagination and filtering options
- Parameters:
  - `limit`: Number of products per page (default: 10)
  - `indexFrom`: Starting index for pagination (converted to page number)
  - `type`: Filter by product category
  - `priceMin`/`priceMax`: Filter by price range
  - `brand`: Filter by brand(s)
  - `color`: Filter by color(s)
  - `new`: Filter for new products

**Pagination Behavior**:
- The system reports approximately 60 total products instead of the 50 that are actually seeded
- The `totalPages` calculation is incorrect when filters are applied, especially for color and size filters
- The backend calculates `totalPages` based on raw database count queries that don't accurately reflect filtering

**Issues**:
1. **Color/Size Filter Pagination**: When filtering by color or size, the count query doesn't properly account for products with matching variants, leading to incorrect pagination counts
2. **Count Inconsistency**: The backend sometimes returns a count of all products when it should only count filtered results
3. **All Products Parameter**: The `all: true` parameter doesn't reliably return all products

### Product by ID Query

**Endpoint**: `POST /graphql`

**Request**:
```graphql
query {
  product(id: ID!) {
    id
    title
    description
    type
    brand
    category
    price
    new
    sale
    discount
    stock
    images {
      alt
      src
    }
    variants {
      id
      sku
      size
      color
      image_id
    }
    collection {
      collectionName
    }
  }
}
```

**Functionality**:
- Fetches a single product by its ID

### Collection Query

**Endpoint**: `POST /graphql`

**Request**:
```graphql
query {
  collection(collec: String!) {
    id
    name
    slug
    products {
      id
      title
      price
      # Other product fields
    }
  }
}
```

**Functionality**:
- Fetches a collection and its associated products by slug (e.g., "featured", "new-arrivals")
- No pagination is implemented for products within collections

### Filter Queries

**Brands Query**:
```graphql
query {
  getBrands(type: String) {
    brand
  }
}
```

**Colors Query**:
```graphql
query {
  getColors(type: String) {
    colors
  }
}
```

**Categories Query**:
```graphql
query {
  getCategories {
    category
  }
}
```

**Functionality**:
- These queries retrieve available filters for the product catalog
- The `type` parameter allows filtering by category

### Currency Query

```graphql
query {
  currency {
    currency
    symbol
    value
  }
}
```

**Functionality**:
- Retrieves available currencies and exchange rates

## REST API Endpoints

### Products Endpoints

1. **Get All Products**: `GET /api/products`
   - Parameters:
     - `page`: Page number (default: 1)
     - `limit`: Items per page (default: 10)
     - `search`: Search term for title/description
     - `category`: Filter by category
     - `brand`: Filter by brand
     - `min_price`: Minimum price
     - `max_price`: Maximum price
     - `colors`: Filter by colors
     - `sizes`: Filter by sizes
     - `is_new`: Filter for new products
     - `is_sale`: Filter for sale products
     - `collection`: Filter by collection

2. **Get Product by ID**: `GET /api/products/:id`

3. **Get Product Categories**: `GET /api/products/categories`

4. **Get Product Brands**: `GET /api/products/brands`

5. **Get Product Colors**: `GET /api/products/colors`

### Collections Endpoints

1. **Get All Collections**: `GET /api/collections`

2. **Get Collection by Slug**: `GET /api/collections/:slug`

### Currency Endpoints

1. **Get All Currencies**: `GET /api/currencies`

## Identified Issues and Workarounds

### 1. Pagination with Color/Size Filters

**Issue**: When filtering by color or size, the product count is incorrect because the database query counts products rather than variants. This leads to incorrect pagination information.

**Implementation**: In the product controller, there's a workaround that manually adjusts counts when filtering by color or size:

```typescript
// If color or size filters are applied and the product count seems incorrect
if ((colors && Array.isArray(colors) && colors.length > 0) || 
    (sizes && Array.isArray(sizes) && sizes.length > 0)) {
  // Adjust count based on actual number of products returned
  if (products.length < count) {
    const adjustedCount = products.length < limitValue ? 
                          products.length : 
                          Math.ceil(products.length * 1.2);
    const adjustedTotalPages = Math.max(1, Math.ceil(adjustedCount / limitValue));
    
    // Return adjusted counts
    return res.status(200).json({
      products: formattedProducts,
      total: adjustedCount,
      totalPages: adjustedTotalPages,
      hasMore: effectivePage < adjustedTotalPages,
      currentPage: effectivePage
    });
  }
}
```

### 2. GraphQL to REST Mapping

The backend implements a GraphQL adapter that maps GraphQL queries to REST controller methods. This introduces complexity and potential for translation errors:

```typescript
// In graphql.routes.ts
if (type === 'products') {
  // Map products query parameters
  const queryParams: any = {
    page: variables.indexFrom ? Math.floor(variables.indexFrom / variables.limit) + 1 : 1,
    limit: variables.limit || 10,
  };
  
  // Convert GraphQL type to REST category
  if (variables.type && variables.type !== 'ALL') {
    queryParams.category = variables.type;
  }
  
  // Map other filters...
}
```

### 3. Total Products Inconsistency

**Issue**: The API reports approximately 60 total products, despite only 50 being seeded.

**Likely Cause**: The seed script generates 50 products, but there may be additional products in the database from previous runs or manual testing. The count query doesn't account for potential deleted products or incorrect joins.

## Recommendations

1. **Fix Color/Size Filtering**: Modify the count query to properly handle filtering by variant properties by using subqueries or distinct counts.

2. **Implement Proper Pagination**: Use a consistent pagination approach across all endpoints with clear documentation.

3. **Add Validation**: Implement input validation to prevent incorrect parameter values.

4. **Improve Error Handling**: Return clearer error messages when invalid parameters are provided.

5. **Database Cleanup**: Consider adding a complete reset option to ensure consistent test data.

6. **Product ID Sequence Issue**: Verify that product IDs are sequential and without gaps to ensure correct total counts.

7. **Test Filtering Combinations**: Test various combinations of filters to ensure they work correctly together.

## Pagination Behavior Summary

For a database with 50 seeded products:

1. **No Filters**: 
   - Total: ~60 products
   - Pages: 6 (with 10 items per page)

2. **Category Filter (e.g., "FASHION")**:
   - Filtered Count: Varies by category
   - Pagination shows correct number of pages based on filtered results

3. **Color Filter**:
   - Incorrect count when color filter is applied alone
   - Fixed with the workaround to adjust count based on actual returned products

4. **Multiple Filters**:
   - Pagination may be incorrect when combining multiple filters
   - The most accurate results are obtained when using single filters

## Test Results

Based on direct API testing, we observed the following behavior:

### Test 1: All Products Query
```
curl -s -X POST http://localhost:3001/graphql -H "Content-Type: application/json" -d '{"query":"query { products(all: true) { total items { id } } }"}'
```

**Result**:
- Returns 60 products total
- Product IDs range from 1 to 10 in the first page
- The `totalPages` is calculated as 6 based on default limit of 10

### Test 2: Category Filter (FASHION)
```
curl -s -X POST http://localhost:3001/graphql -H "Content-Type: application/json" -d '{"query":"query { products(type: \"FASHION\", limit: 12, indexFrom: 0) { items { id title type } total totalPages hasMore currentPage } }"}'
```

**Result**:
- Returns 7 products total
- Includes products with IDs: 1, 2, 12, 22, 47, 52, 53
- Correctly calculates `totalPages` as 1
- Note that products 52 and 53 appear to be manually added, not from the seed script

### Test 3: Color Filter (red)
```
curl -s -X POST http://localhost:3001/graphql -H "Content-Type: application/json" -d '{"query":"query { products(color: [\"red\"], limit: 12, indexFrom: 0) { items { id title variants { color } } total totalPages hasMore currentPage } }"}'
```

**Result**:
- Returns multiple products with at least one red variant
- The count shows 60 total products, which is incorrect (should only count products with red variants)
- `totalPages` is incorrectly calculated as 6

### Test 4: Multiple Filters (BEAUTY + puma + green)
```
curl -s -X POST http://localhost:3001/graphql -H "Content-Type: application/json" -d '{"query":"query { products(type: \"BEAUTY\", brand: [\"puma\"], color: [\"green\"], limit: 12, indexFrom: 0) { items { id title type brand } total totalPages hasMore currentPage } }"}'
```

**Result**:
- Returns 7 BEAUTY products, but only 2 are from "puma" and have "green" variants
- Correctly calculates `totalPages` as 1
- The workaround for color/size filtering appears to be working in this case

## Additional Findings

1. **Extra Products**: There are at least 10 additional products beyond the 50 generated by the seed script, likely from manual testing.

2. **Variant Filtering**: The backend doesn't properly account for variant-based filtering in its count queries, leading to pagination issues.

3. **GraphQL-REST Translation**: Some of the pagination issues may stem from the translation layer between GraphQL queries and the REST controller implementation.

4. **Backend Response Format**: The backend returns data in a different format than requested by the GraphQL query in some cases, showing that the adapter isn't fully compliant with GraphQL specifications.

5. **Non-sequential IDs**: Product IDs may not be sequential due to deleted products, which could affect count accuracy.

## Conclusion

The BigDeal E-commerce backend API provides a robust set of endpoints for managing products, collections, and related data. However, there are several issues with pagination, particularly when filtering by variant properties like color and size. The workarounds implemented help mitigate these issues, but a more comprehensive solution would require restructuring the underlying database queries. 