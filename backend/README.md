# BigDeal E-commerce Backend

This is a PostgreSQL-based REST API backend for the BigDeal E-commerce platform. It includes a GraphQL adapter layer that allows frontend applications designed for GraphQL to interact with this REST API seamlessly.

## Features

- PostgreSQL database for reliable data storage
- REST API endpoints for all e-commerce operations
- GraphQL adapter layer for GraphQL-based frontends
- JWT authentication
- Product, collection, and order management
- User account handling

## Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## Database Setup

The application requires a PostgreSQL database. You can set it up in two ways:

### Option 1: Using the Reset Script (Recommended)

This will completely reset the database, creating all tables and seeding them with test data:

```bash
# Make the script executable
chmod +x reset-db.js

# Run the script
node reset-db.js
```

### Option 2: Using Migrations and Seeds

```bash
# Run migrations
npm run migrate:latest

# Run seeds
npm run seed
```

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```
PORT=3002
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bigdeal_ecommerce

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=uploads
```

## Starting the Server

```bash
# Install dependencies
npm install

# Option A: Start using the convenient script
chmod +x start.sh
./start.sh

# Option B: Start directly with npm
npm run dev
```

The server will start at http://localhost:3002.

## API Endpoints

### REST API

- **Products**: `/api/products`
- **Product by ID**: `/api/products/:id`
- **Collections**: `/api/collections`
- **Collection by Slug**: `/api/collections/:slug`
- **Product Brands**: `/api/products/brands`
- **Product Colors**: `/api/products/colors`

### GraphQL Endpoint

The GraphQL adapter is available at: `/graphql`

Example queries:

**Get all products**:
```graphql
{
  products {
    items {
      id
      title
      price
      images {
        src
      }
    }
    total
    hasMore
  }
}
```

**Get a specific product**:
```graphql
{
  product {
    id
    title
    description
    variants {
      size
      color
    }
  }
}
```

*Variables:*
```json
{
  "id": 1
}
```

**Get products by category**:
```graphql
{
  products {
    items {
      id
      title
      type
    }
  }
}
```

*Variables:*
```json
{
  "type": "FASHION"
}
```

## Running the Tests

```bash
npm test
```

## Deployment

For production, build the TypeScript code:

```bash
npm run build
npm start
```

## License

MIT 

## AWS RDS Setup

To use AWS RDS (Relational Database Service) for PostgreSQL:

### Creating an RDS Instance

1. Sign in to the AWS Management Console and navigate to RDS
2. Click "Create database"
3. Choose PostgreSQL as the database engine
4. Select the desired version (compatible with PostgreSQL 13+)
5. Choose your instance size and storage (db.t3.micro is suitable for development)
6. Configure:
   - Instance identifier: `bigdeal-ecommerce-db` (or your preferred name)
   - Set master username and password
   - Set VPC, subnet group, and security groups
   - Make sure the security group allows inbound traffic on port 5432 from your application server
7. Additional configuration:
   - Initial database name: `bigdeal_ecommerce`
   - Set backup retention, monitoring options as needed
8. Create database

### Configuring Environment Variables

Update your `.env` file with the RDS details:

```
# Database Configuration - AWS RDS
DB_HOST=your-rds-instance-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_USER=your_rds_username
DB_PASSWORD=your_rds_password
DB_NAME=bigdeal_ecommerce
DB_SSL=true
```

### Migrating Existing Data to RDS

A migration script is provided to transfer your local database to RDS:

1. Ensure your local PostgreSQL server is running
2. Update `.env` with your RDS connection details
3. Run the migration script:

```bash
./scripts/migrate-to-rds.sh
```

This script will:
- Export your local database
- Create the target database on RDS if it doesn't exist
- Import the data to RDS
- Clean up temporary files

### Running the Application with RDS

Once your database is migrated to RDS, you can start the application normally:

```bash
npm run dev
```

The application will connect to your RDS instance based on the environment variables.

## API Documentation

API documentation is available at `/api-docs` when the server is running. 