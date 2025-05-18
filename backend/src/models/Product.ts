export interface Product {
  id?: number;
  title: string;
  description?: string;
  type?: string;
  brand?: string;
  category?: string;
  price: number;
  is_new: boolean;
  is_sale: boolean;
  is_featured: boolean;
  discount: number;
  stock: number;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_image?: string;
  meta_keywords?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductImage {
  id?: number;
  product_id: number;
  image_id?: string;
  alt?: string;
  src: string;
  is_primary: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductVariant {
  id?: number;
  product_id: number;
  sku?: string;
  size?: string;
  color?: string;
  image_id?: string;
  image_url?: string;
  price?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Collection {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductCollection {
  product_id: number;
  collection_id: number;
}

// Input types for API requests
export interface ProductCreateInput {
  title: string;
  description?: string;
  type?: string;
  brand?: string;
  category?: string;
  price: number;
  is_new?: boolean;
  is_sale?: boolean;
  is_featured?: boolean;
  discount?: number;
  stock?: number;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_image?: string;
  meta_keywords?: string;
  variants?: Omit<ProductVariant, 'product_id' | 'id' | 'created_at' | 'updated_at'>[];
  images?: Omit<ProductImage, 'product_id' | 'id' | 'created_at' | 'updated_at'>[];
  collections?: number[];
}

export interface ProductUpdateInput {
  title?: string;
  description?: string;
  type?: string;
  brand?: string;
  category?: string;
  price?: number;
  is_new?: boolean;
  is_sale?: boolean;
  is_featured?: boolean;
  discount?: number;
  stock?: number;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_image?: string;
  meta_keywords?: string;
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  all?: boolean | string;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  category?: string;
  brand?: string | string[];
  min_price?: number;
  max_price?: number;
  colors?: string[];
  sizes?: string[];
  is_new?: boolean | string;
  is_sale?: boolean | string;
  is_featured?: boolean | string;
  collection?: string;
} 