import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Creates a new Razorpay order
 * @param amount - Amount in smallest currency unit (paise for INR)
 * @param receipt - Receipt number (typically the order ID from your system)
 * @param notes - Optional notes to attach to the order
 * @returns Razorpay order details
 */
export const createRazorpayOrder = async (
  amount: number,
  receipt: string,
  notes: Record<string, string> = {}
) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (Razorpay uses smallest currency unit)
      currency: process.env.RAZORPAY_CURRENCY || 'INR',
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verifies Razorpay payment signature
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Razorpay signature
 * @returns Boolean indicating if the signature is valid
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay payment signature:', error);
    throw error;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 * @returns Payment details
 */
export const getPaymentDetails = async (paymentId: string) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

export default {
  createRazorpayOrder,
  verifyPaymentSignature,
  getPaymentDetails,
}; 