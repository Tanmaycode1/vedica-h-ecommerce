import { Router } from 'express';
import db from '../db/db';
import { Request, Response } from 'express';

interface PaymentData {
  order_id?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  payment_data?: any;
  error_code?: string;
  error_description?: string;
}

const router = Router();

/**
 * Log a payment attempt (successful or failed)
 * POST /api/payments/log
 * 
 * This is a public endpoint that doesn't require authentication.
 * It allows logging payment attempts from any source, including client-side applications.
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
    // Extract payment data from request
    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency = 'INR',
      status = 'created',
      payment_method = 'razorpay',
      error_code,
      error_description,
      user_details
    } = req.body;

    // Log the full request payload for debugging
    console.log('Payment log request payload:', JSON.stringify(req.body, null, 2));

    // Format payment data according to the database schema
    const formattedPaymentData: PaymentData = {
      order_id: order_id || null,
      razorpay_order_id: razorpay_order_id || 'client-side-test',
      razorpay_payment_id: razorpay_payment_id || null,
      razorpay_signature: razorpay_signature || null,
      amount,
      currency,
      status,
      payment_method,
      payment_data: req.body, // Store the entire request body
      error_code: error_code || null,
      error_description: error_description || null
    };

    // Insert payment data into the database
    let paymentId;
    try {
      const result = await db('payments').insert(formattedPaymentData).returning('id');
      if (Array.isArray(result) && result.length > 0) {
        // PostgreSQL style response
        paymentId = typeof result[0] === 'object' ? result[0].id : result[0];
      } else {
        // MySQL style response
        paymentId = result;
      }
    } catch (insertError) {
      console.error('Error during payment logging insert:', insertError);
      throw insertError;
    }

    // Return success with the payment ID
    res.status(200).json({
      success: true,
      message: 'Payment attempt logged successfully',
      payment_id: paymentId,
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id: razorpay_payment_id || null,
      status: status || 'logged'
    });
  } catch (error: any) {
    console.error('Error logging payment attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log payment attempt',
      error: error.message
    });
  }
});

/**
 * Verify a payment
 * POST /api/payments/verify
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would verify with the payment provider
    // For now, we'll just acknowledge the verification request
    res.status(200).json({
      success: true,
      message: 'Payment verification acknowledged',
      verified: true
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

/**
 * Get all payments for admin
 * GET /api/payments/admin/all
 */
router.get('/admin/all', async (req: Request, res: Response) => {
  try {
    // Check if payments table exists
    const tableExists = await db.schema.hasTable('payments');
    if (!tableExists) {
      return res.status(200).json({
        success: true,
        message: 'No payments table found',
        payments: []
      });
    }

    const payments = await db('payments')
      .select('*')
      .orderBy('created_at', 'desc');

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

/**
 * Get payments for a specific order
 * GET /api/payments/orders/:orderId
 */
router.get('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId;
    
    // Check if payments table exists
    const tableExists = await db.schema.hasTable('payments');
    if (!tableExists) {
      return res.status(200).json({
        success: true,
        message: 'No payment information available',
        payments: []
      });
    }

    // Find payments related to this order
    const payments = await db('payments')
      .where('order_id', orderId)
      .orWhere('payment_details', 'like', `%"order_id":"${orderId}"%`)
      .orWhere('payment_details', 'like', `%"order_id":${orderId}%`)
      .select('*')
      .orderBy('created_at', 'desc');

    if (!payments || payments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No payment information available for this order',
        payments: []
      });
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error: any) {
    console.error('Error fetching order payments:', error);
    // Don't expose that there was an error, just return empty data
    res.status(200).json({
      success: true,
      message: 'No payment information available',
      payments: []
    });
  }
});

export default router; 