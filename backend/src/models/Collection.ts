export interface Collection {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  collection_type?: string;
  level?: number;
  is_active?: boolean;
  image_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CollectionWithProducts extends Collection {
  products_count?: number;
  products?: any[];
  children?: CollectionWithProducts[];
}

export interface CollectionCreateInput {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  collection_type?: string;
  is_active?: boolean;
  image_url?: string;
}

export interface CollectionUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  collection_type?: string;
  is_active?: boolean;
  image_url?: string;
}

export interface CollectionTreeItem extends Collection {
  children: CollectionTreeItem[];
}

export interface CollectionQueryOptions {
  parent_id?: number | null;
  collection_type?: string;
  include_inactive?: boolean;
  flat?: boolean;
  search?: string;
} 