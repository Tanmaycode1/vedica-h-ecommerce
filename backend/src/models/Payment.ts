export interface Payment {
  id?: number;
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: string; // 'created', 'authorized', 'captured', 'failed', 'refunded'
  payment_method?: string;
  payment_data?: any; // Complete payment data from Razorpay
  error_code?: string;
  error_description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PaymentCreateInput {
  order_id: number;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  payment_data?: any;
}

export interface PaymentUpdateInput {
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status?: string;
  payment_data?: any;
  error_code?: string;
  error_description?: string;
}

export interface PaymentVerificationInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
} 