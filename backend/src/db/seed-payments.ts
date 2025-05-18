import db from './db';
import { Payment } from '../models/Payment';

async function seedPaymentsOnly() {
  try {
    console.log('Seeding payments for existing orders...');

    // Clean existing payment data
    await db('payments').del();

    // Get existing orders
    const orders = await db('orders').select('*');
    
    if (orders.length === 0) {
      console.warn('No orders found. Please run seed-orders.ts first.');
      return;
    }

    console.log(`Found ${orders.length} orders to process.`);

    // Set a mix of payment statuses
    const payments: Partial<Payment>[] = [];
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      // Distribute payment statuses across orders
      // 60% captured/paid, 20% failed, 20% created/pending
      let status: string;
      
      if (i % 5 === 0) {
        status = 'failed';
        // Update the order payment status
        await db('orders').where('id', order.id).update({
          payment_status: 'failed'
        });
      } else if (i % 5 === 1) {
        status = 'created';
        // Update the order payment status
        await db('orders').where('id', order.id).update({
          payment_status: 'pending'
        });
      } else {
        status = 'captured';
        // Update the order payment status
        await db('orders').where('id', order.id).update({
          payment_status: 'paid'
        });
      }
      
      const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;
      
      const paymentData: Partial<Payment> = {
        order_id: order.id,
        razorpay_order_id: razorpayOrderId,
        amount: parseFloat(order.total),
        currency: 'INR',
        status,
        payment_method: 'razorpay',
        created_at: order.created_at,
        updated_at: order.updated_at
      };
      
      // For paid/captured payments, add payment ID and signature
      if (status === 'captured') {
        paymentData.razorpay_payment_id = `pay_${Math.random().toString(36).substring(2, 15)}`;
        paymentData.razorpay_signature = `${Math.random().toString(36).substring(2, 40)}`;
        
        // Sample payment data
        paymentData.payment_data = JSON.stringify({
          id: paymentData.razorpay_payment_id,
          entity: 'payment',
          amount: (paymentData.amount || 0) * 100, // In paise (smallest currency unit)
          currency: 'INR',
          status,
          order_id: razorpayOrderId,
          method: 'card',
          card: {
            last4: '1111',
            network: 'Visa'
          },
          email: 'customer@example.com',
          contact: '+1234567890'
        });
        
        // Update order with Razorpay details
        await db('orders').where('id', order.id).update({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          payment_details: paymentData.payment_data
        });
      }
      
      // For failed payments, add error details
      if (status === 'failed') {
        paymentData.error_code = 'PAYMENT_FAILED';
        paymentData.error_description = 'Payment transaction failed';
        
        // Sample payment data for failed payment
        paymentData.payment_data = JSON.stringify({
          id: `pay_${Math.random().toString(36).substring(2, 15)}`,
          entity: 'payment',
          amount: (paymentData.amount || 0) * 100,
          currency: 'INR',
          status,
          order_id: razorpayOrderId,
          error_code: 'PAYMENT_FAILED',
          error_description: 'Payment transaction failed'
        });
        
        // Update order with Razorpay details
        await db('orders').where('id', order.id).update({
          razorpay_order_id: razorpayOrderId,
          payment_details: paymentData.payment_data
        });
      }
      
      // For created/pending payments
      if (status === 'created') {
        // Sample payment data for pending payment
        paymentData.payment_data = JSON.stringify({
          entity: 'payment',
          amount: (paymentData.amount || 0) * 100,
          currency: 'INR',
          status,
          order_id: razorpayOrderId,
          receipt: `receipt_${order.id}`,
          notes: {
            order_id: order.id.toString()
          }
        });
        
        // Update order with Razorpay details
        await db('orders').where('id', order.id).update({
          razorpay_order_id: razorpayOrderId,
          payment_details: paymentData.payment_data
        });
      }
      
      payments.push(paymentData);
    }
    
    // Insert payments
    if (payments.length > 0) {
      await db('payments').insert(payments);
      console.log(`Successfully seeded ${payments.length} payments.`);
    } else {
      console.log('No payments were generated.');
    }

    console.log('Payment seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding payments:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedPaymentsOnly(); 