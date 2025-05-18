# BigDeal E-commerce: Backend Integration Guide

## Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Reset and seed the database:
   ```
   node reset-db.js
   ```

4. Start the backend server:
   ```
   ./start.sh
   ```

5. Verify the server is running by visiting:
   - REST API: http://localhost:3002/api/products
   - GraphQL endpoint: http://localhost:3002/graphql

## Frontend Integration

The template has been configured to use our PostgreSQL backend with GraphQL adapter. The configuration changes include:

1. Updated GraphQL endpoint in `next.config.js`:
   ```javascript
   env: {
     API_URL: "http://localhost:3002/graphql",
   },
   ```

2. Updated GraphQL endpoint in `helpers/apollo.js`:
   ```javascript
   uri: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/graphql",
   ```

3. Created `.env` file with proper configuration:
   ```
   API_URL=http://localhost:3002/graphql
   NEXT_PUBLIC_API_URL=http://localhost:3002/graphql
   ```

4. Fixed currency handling in `TopBar/index.tsx`:
   ```javascript
   // Default currencies if API returns empty
   const defaultCurrencies = [
     { currency: "USD", symbol: "$", value: 1 },
     { currency: "EUR", symbol: "€", value: 0.92 },
     { currency: "GBP", symbol: "£", value: 0.81 }
   ];
   
   // Safely access currency data with fallback
   const currencies = (data && data.currency) ? data.currency : defaultCurrencies;
   ```

## Running the Frontend

1. Navigate to the template directory:
   ```
   cd template
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Visit the website at:
   ```
   http://localhost:3000
   ```

## Verification

To verify the integration is working correctly:

1. Check that product listings appear on the homepage
2. Navigate to the collections page and verify products are displayed
3. Verify that filters (category, brand, color) work correctly
4. Open a product detail page and verify all information is displayed
5. Check the browser console for any GraphQL-related errors
6. Verify the currency selector in the top bar works correctly

## Troubleshooting

If you encounter any issues:

1. Ensure the backend server is running (`./start.sh` in the backend directory)
2. Check the browser console for GraphQL errors
3. Verify the GraphQL endpoint is correctly set in `.env` and `next.config.js`
4. Try refreshing the page or restarting the development server
5. If products aren't showing, verify the database was seeded correctly by checking http://localhost:3002/api/products
6. If the currency selector is not working, check the currency data at http://localhost:3002/api/currencies

## Recent Fixes

1. **Currency Data Handling**: Fixed the TopBar component to handle undefined currency data with a fallback to default currencies.
2. **GraphQL Adapter**: Updated the GraphQL adapter to support both `currency` and `getCurrency` query formats.
3. **Database Seeding**: Added currency seed data to ensure the currency dropdown works properly. 