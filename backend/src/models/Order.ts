export interface Order {
  id?: number;
  user_id?: number;
  status: string;
  total: number;
  shipping_address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  billing_address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_details?: any;
  created_at?: Date;
  updated_at?: Date;
  items?: OrderItem[];
  user?: any;
}

export interface OrderItem {
  id?: number;
  order_id: number;
  product_id?: number;
  variant_id?: number;
  quantity: number;
  price: number;
  title?: string;
  variant_name?: string;
  image?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderCreateInput {
  user_id?: number;
  items: {
    product_id: number;
    variant_id?: number;
    quantity: number;
  }[];
  shipping_address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  billing_address?: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  payment_method: string;
  payment_status?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_details?: any;
}

export interface OrderUpdateInput {
  status?: string;
  payment_status?: string;
  tracking_number?: string;
  shipping_address?: any;
  billing_address?: any;
  payment_details?: any;
} 