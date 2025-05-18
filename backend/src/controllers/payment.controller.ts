import { Request, Response } from 'express';
import db from '../db/db';
import { Order } from '../models/Order';
import { Payment, PaymentCreateInput, PaymentUpdateInput, PaymentVerificationInput } from '../models/Payment';
import { createRazorpayOrder, verifyPaymentSignature, getPaymentDetails } from '../utils/razorpay';

/**
 * Create a Razorpay order for an existing order
 */
export const createPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get order details
    const order = await db<Order>('orders').where('id', orderId).first();
    
    if (!order) {
      res.status(404).json({ error: true, message: 'Order not found' });
      return;
    }
    
    // Check if payment is already created
    const existingPayment = await db<Payment>('payments')
      .where('order_id', orderId)
      .where('status', 'created')
      .first();
    
    if (existingPayment) {
      res.status(200).json({
        success: true,
        message: 'Payment order already exists',
        payment: existingPayment,
        key_id: process.env.RAZORPAY_KEY_ID,
      });
      return;
    }
    
    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(
      order.total,
      `order_${orderId}`,
      { order_id: orderId.toString() }
    );
    
    // Save payment details in our database
    const paymentData: PaymentCreateInput = {
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      amount: order.total,
      currency: razorpayOrder.currency,
      status: 'created',
      payment_data: razorpayOrder
    };
    
    // Fix the destructuring issue with database insert
    let paymentId;
    try {
      // Try to handle as returning array of objects with id property
      const result = await db<Payment>('payments').insert(paymentData).returning('id');
      if (Array.isArray(result) && result.length > 0) {
        // PostgreSQL style response
        paymentId = typeof result[0] === 'object' ? result[0].id : result[0];
      } else {
        // MySQL style response - get the insertId directly
        paymentId = result;
      }
    } catch (insertError) {
      console.error('Error during payment insert:', insertError);
      throw insertError;
    }
    
    // Update order with Razorpay order ID
    await db<Order>('orders')
      .where('id', orderId)
      .update({
        razorpay_order_id: razorpayOrder.id,
        updated_at: db.fn.now()
      });
    
    // Get complete payment record
    const payment = await db<Payment>('payments').where('id', paymentId).first();
    
    res.status(200).json({
      success: true,
      message: 'Payment order created',
      payment,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: true, message: 'Failed to create payment order' });
  }
};

/**
 * Verify and process Razorpay payment
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature }: PaymentVerificationInput = req.body;
    
    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    
    if (!isValidSignature) {
      res.status(400).json({ error: true, message: 'Invalid payment signature' });
      return;
    }
    
    // Get payment from our database
    const payment = await db<Payment>('payments')
      .where('razorpay_order_id', razorpay_order_id)
      .first();
    
    if (!payment) {
      res.status(404).json({ error: true, message: 'Payment not found' });
      return;
    }
    
    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(razorpay_payment_id);
    
    // Update payment record
    const updateData: PaymentUpdateInput = {
      razorpay_payment_id,
      razorpay_signature,
      status: paymentDetails.status,
      payment_data: paymentDetails
    };
    
    await db<Payment>('payments')
      .where('id', payment.id)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      });
    
    // Update order payment status
    let orderPaymentStatus = 'pending';
    if (paymentDetails.status === 'captured') {
      orderPaymentStatus = 'paid';
    } else if (paymentDetails.status === 'failed') {
      orderPaymentStatus = 'failed';
    }
    
    await db<Order>('orders')
      .where('id', payment.order_id)
      .update({
        payment_status: orderPaymentStatus,
        razorpay_payment_id,
        payment_details: paymentDetails,
        updated_at: db.fn.now()
      });
    
    // Get updated payment record
    const updatedPayment = await db<Payment>('payments')
      .where('id', payment.id)
      .first();
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: true, message: 'Failed to verify payment' });
  }
};

/**
 * Handle payment failure
 */
export const handlePaymentFailure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, error_code, error_description } = req.body;
    
    // Get payment from our database
    const payment = await db<Payment>('payments')
      .where('razorpay_order_id', razorpay_order_id)
      .first();
    
    if (!payment) {
      res.status(404).json({ error: true, message: 'Payment not found' });
      return;
    }
    
    // Update payment record
    const updateData: PaymentUpdateInput = {
      status: 'failed',
      error_code,
      error_description
    };
    
    await db<Payment>('payments')
      .where('id', payment.id)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      });
    
    // Update order payment status
    await db<Order>('orders')
      .where('id', payment.order_id)
      .update({
        payment_status: 'failed',
        updated_at: db.fn.now()
      });
    
    // Get updated payment record
    const updatedPayment = await db<Payment>('payments')
      .where('id', payment.id)
      .first();
    
    res.status(200).json({
      success: true,
      message: 'Payment failure recorded',
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.status(500).json({ error: true, message: 'Failed to handle payment failure' });
  }
};

/**
 * Get payment details for an order
 */
export const getPaymentByOrderId = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get payment from our database
    const payments = await db<Payment>('payments')
      .where('order_id', orderId)
      .orderBy('created_at', 'desc');
    
    if (!payments || payments.length === 0) {
      res.status(404).json({ error: true, message: 'No payments found for this order' });
      return;
    }
    
    res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch payment details' });
  }
};

/**
 * Get all payments (admin only)
 */
export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Get payments
    const payments = await db<Payment>('payments')
      .join('orders', 'payments.order_id', 'orders.id')
      .select(
        'payments.*',
        'orders.user_id',
        db.raw('(SELECT name FROM users WHERE id = orders.user_id) as user_name'),
        db.raw('(SELECT email FROM users WHERE id = orders.user_id) as user_email')
      )
      .orderBy('payments.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const countResult = await db('payments').count('id as count').first();
    const total = countResult ? Number(countResult.count) : 0;
    
    res.status(200).json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch payments' });
  }
}; 