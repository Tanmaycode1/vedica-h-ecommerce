import db from './db';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';

async function seedOrdersAndPayments() {
  try {
    console.log('Seeding orders and payments...');

    // Clean existing data
    await db('payments').del();
    await db('order_items').del();
    await db('orders').del();

    // Get users
    const users = await db('users').limit(3);
    
    if (users.length === 0) {
      console.warn('No users found. Creating a test user...');
      
      // Create a test user if none exists
      const [userId] = await db('users').insert({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password', // In a real app, this would be hashed
        role: 'customer'
      }).returning('id');
      
      users.push({ id: userId, name: 'Test User', email: 'test@example.com' });
    }

    // Get products
    const products = await db('products').limit(5);
    
    if (products.length === 0) {
      console.warn('No products found in the database. Creating test products...');
      
      // Create test products if none exist
      const productIds = await db('products').insert([
        {
          title: 'Test Product 1',
          description: 'This is a test product',
          price: 99.99,
          is_new: true,
          is_sale: false,
          discount: 0,
          stock: 10,
          slug: 'test-product-1'
        },
        {
          title: 'Test Product 2',
          description: 'This is another test product',
          price: 149.99,
          is_new: false,
          is_sale: true,
          discount: 10,
          stock: 5,
          slug: 'test-product-2'
        }
      ]).returning('id');
      
      for (const id of productIds) {
        products.push({ id, title: `Test Product ${id}`, price: 99.99 });
      }
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
        shipping_address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zip_code: '12345',
          country: 'Test Country'
        },
        billing_address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zip_code: '12345',
          country: 'Test Country'
        },
        tracking_number: status === 'shipped' || status === 'delivered' ? `TRK${i}${Math.floor(Math.random() * 100000)}` : undefined,
        created_at: date,
        updated_at: date
      });
    }

    // Insert orders
    const orderIds = [];
    for (const order of orders) {
      const [orderId] = await db('orders').insert(order).returning('id');
      orderIds.push(orderId);
    }
    console.log(`Created ${orderIds.length} orders with IDs:`, orderIds);

    // Generate order items
    const orderItems = [];
    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      // Make sure we have a simple number, not an object
      const numericOrderId = typeof orderId === 'object' && orderId.id ? orderId.id : Number(orderId);
      
      // Each order gets 1-3 items
      const numItems = Math.floor(Math.random() * 3) + 1;
      let total = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = parseFloat(product.price);
        
        orderItems.push({
          order_id: numericOrderId,
          product_id: product.id,
          variant_id: null, // You can set this if you have variants
          quantity,
          price
        });
        
        total += price * quantity;
      }
      
      // Update order total with the numeric ID
      await db('orders').where('id', numericOrderId).update({ total });
    }
    
    // Insert order items
    await db('order_items').insert(orderItems);
    console.log(`Created ${orderItems.length} order items`);

    // Create Razorpay payment records for orders using Razorpay
    const razorpayOrders = await db('orders').whereIn('payment_method', ['razorpay']).select('*');
    
    const payments: Partial<Payment>[] = [];
    
    // Process payments one by one to avoid id issues
    for (const order of razorpayOrders) {
      const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 11)}`;
      const status = order.payment_status === 'paid' ? 'captured' : 
                   order.payment_status === 'failed' ? 'failed' : 'created';
      
      // Make sure we have a numeric order ID
      const numericOrderId = typeof order.id === 'object' ? 
        (order.id.hasOwnProperty('id') ? order.id.id : Number(order.id)) : 
        Number(order.id);
      
      const paymentData: Partial<Payment> = {
        order_id: numericOrderId,
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
        paymentData.razorpay_payment_id = `pay_${Math.random().toString(36).substring(2, 11)}`;
        paymentData.razorpay_signature = `${Math.random().toString(36).substring(2, 34)}`;
        
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
        await db('orders').where('id', numericOrderId).update({
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
          id: `pay_${Math.random().toString(36).substring(2, 11)}`,
          entity: 'payment',
          amount: (paymentData.amount || 0) * 100,
          currency: 'INR',
          status,
          order_id: razorpayOrderId,
          error_code: 'PAYMENT_FAILED',
          error_description: 'Payment transaction failed'
        });
        
        // Update order with Razorpay details
        await db('orders').where('id', numericOrderId).update({
          razorpay_order_id: razorpayOrderId,
          payment_details: paymentData.payment_data
        });
      }
      
      // Insert payment record
      await db('payments').insert(paymentData);
      payments.push(paymentData);
    }

    console.log(`Seeded ${orderIds.length} orders and ${payments.length} payments`);
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding orders and payments:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedOrdersAndPayments(); 