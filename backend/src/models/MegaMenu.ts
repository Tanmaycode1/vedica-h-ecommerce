export interface MegaMenuCollection {
  id: number;
  collection_id: number;
  position: number;
  is_active: boolean;
  parent_menu_item_id?: number | null;
  display_subcollections?: boolean;
  level?: number;
  created_at?: Date;
  updated_at?: Date;
  
  // Joined fields
  collection_name?: string;
  collection_slug?: string;
  parent_id?: number | null; // collection's parent_id (from collections table)
  collection_type?: string;
  collection_level?: number; // collection's level (from collections table)
  children?: MegaMenuCollection[];
}

export interface MegaMenuCreateInput {
  collection_id: number;
  position?: number;
  is_active?: boolean;
  parent_menu_item_id?: number | null;
  display_subcollections?: boolean;
  level?: number;
}

export interface MegaMenuUpdateInput {
  collection_id?: number;
  position?: number;
  is_active?: boolean;
  parent_menu_item_id?: number | null;
  display_subcollections?: boolean;
}

export interface MegaMenuQueryOptions {
  include_inactive?: boolean;
  include_descendants?: boolean;
}

export interface MegaMenuSubcollectionCreateInput {
  collection_id: number;
  parent_menu_item_id: number;
  position?: number;
  is_active?: boolean;
} 