/**
 * GraphQL Schema Definition
 * 
 * This file provides documentation of the GraphQL schema that our Express adapter supports.
 * We're not actually using this file for validation; it's just for reference.
 */

// Product Schema
export const ProductSchema = `
  type Product {
    id: ID!
    title: String!
    description: String
    type: String
    brand: String
    category: String
    price: Float!
    is_new: Boolean
    is_sale: Boolean
    discount: Int
    stock: Int
    images: [ProductImage]
    variants: [ProductVariant]
  }

  type ProductImage {
    id: ID
    alt: String
    src: String!
  }

  type ProductVariant {
    id: ID!
    sku: String
    size: String
    color: String
    price: Float
  }

  type ProductsResponse {
    products: [Product]
    total: Int
    totalPages: Int
    hasMore: Boolean
    currentPage: Int
  }
`;

// Collection Schema
export const CollectionSchema = `
  type Collection {
    collection: CollectionData
    products: [Product]
  }

  type CollectionData {
    id: ID!
    name: String!
    slug: String!
    description: String
  }
`;

// Currency Schema
export const CurrencySchema = `
  type Currency {
    currency: String!
    symbol: String!
    value: Float!
  }
`;

// Filter Schemas
export const FilterSchema = `
  type Brand {
    brand: String!
  }

  type Color {
    color: String!
  }
`;

// Main Schema
export const MainSchema = `
  type Query {
    products(
      indexFrom: Int
      limit: Int
      type: String
      priceMin: Float
      priceMax: Float
      brand: [String]
      color: [String]
      new: Boolean
    ): ProductsResponse
    
    product(id: ID!): Product
    
    collection(collec: String!): Collection
    
    getBrands(type: String): [Brand]
    
    getColors(type: String): [Color]
    
    currency: [Currency]
    
    getCurrency: [Currency]
  }
`; 