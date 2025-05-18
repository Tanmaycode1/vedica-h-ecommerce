import { Knex } from 'knex';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing records
  await knex('payments').del();
  await knex('order_items').del();
  await knex('orders').del();

  // Sample users (assuming you have users with IDs 1, 2, and 3)
  const users = await knex('users').limit(3);
  
  if (users.length === 0) {
    console.warn('No users found in the database, skipping order seed');
    return;
  }

  // Sample products
  const products = await knex('products').limit(5);
  
  if (products.length === 0) {
    console.warn('No products found in the database, skipping order seed');
    return;
  }

  // Define some order statuses
  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
  const paymentMethods = ['razorpay', 'cash_on_delivery', 'bank_transfer'];

  // Generate 10 sample orders
  const orders: Partial<Order>[] = [];
  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days

    orders.push({
      user_id: user.id,
      status,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      total: 0, // Will be calculated based on items
      shipping_address: JSON.stringify({
        name: `${user.name}`,
        email: user.email,
        address_line1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: 'Test Country',
        phone: '1234567890'
      }),
      billing_address: JSON.stringify({
        name: `${user.name}`,
        email: user.email,
        address_line1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: 'Test Country',
        phone: '1234567890'
      }),
      tracking_number: status === 'shipped' || status === 'delivered' ? `TRK${i}${Math.floor(Math.random() * 100000)}` : undefined,
      created_at: date,
      updated_at: date
    });
  }

  // Insert orders and get IDs
  const orderIds = await knex('orders').insert(orders).returning('id');

  // Generate order items
  const orderItems = [];
  for (const orderId of orderIds) {
    // Each order gets 1-3 items
    const numItems = Math.floor(Math.random() * 3) + 1;
    let total = 0;
    
    for (let i = 0; i < numItems; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = parseFloat(product.price);
      
      orderItems.push({
        order_id: orderId,
        product_id: product.id,
        variant_id: null, // You can set this if you have variants
        quantity,
        price
      });
      
      total += price * quantity;
    }
    
    // Update order total
    await knex('orders').where('id', orderId).update({ total });
  }
  
  // Insert order items
  await knex('order_items').insert(orderItems);

  // Create Razorpay payment records for orders using Razorpay
  const razorpayOrders = await knex('orders').whereIn('payment_method', ['razorpay']).select('*');
  
  const payments: Partial<Payment>[] = [];
  for (const order of razorpayOrders) {
    const razorpayOrderId = `order_${Math.random().toString(36).substr(2, 9)}`;
    const status = order.payment_status === 'paid' ? 'captured' : 
                   order.payment_status === 'failed' ? 'failed' : 'created';
    
    const paymentData: Partial<Payment> = {
      order_id: order.id,
      razorpay_order_id: razorpayOrderId,
      amount: (order.total || 0) * 100,
      currency: 'INR',
      status,
      payment_method: 'razorpay',
      created_at: order.created_at,
      updated_at: order.updated_at
    };
    
    // For paid/captured payments, add payment ID and signature
    if (status === 'captured') {
      paymentData.razorpay_payment_id = `pay_${Math.random().toString(36).substr(2, 9)}`;
      paymentData.razorpay_signature = `${Math.random().toString(36).substr(2, 32)}`;
      
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
      await knex('orders').where('id', order.id).update({
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
        id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        entity: 'payment',
        amount: (paymentData.amount || 0) * 100,
        currency: 'INR',
        status,
        order_id: razorpayOrderId,
        error_code: 'PAYMENT_FAILED',
        error_description: 'Payment transaction failed'
      });
      
      // Update order with Razorpay details
      await knex('orders').where('id', order.id).update({
        razorpay_order_id: razorpayOrderId,
        payment_details: paymentData.payment_data
      });
    }
    
    payments.push(paymentData);
  }
  
  // Insert payments
  if (payments.length > 0) {
    await knex('payments').insert(payments);
  }

  console.log(`Seeded ${orderIds.length} orders and ${payments.length} payments`);
} 