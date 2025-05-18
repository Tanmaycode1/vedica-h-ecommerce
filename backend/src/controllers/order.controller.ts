import { Request, Response } from 'express';
import db from '../db/db';
import { Order, OrderCreateInput, OrderItem, OrderUpdateInput } from '../models/Order';

// Define interface for the items to process to resolve type errors
interface OrderItemToProcess {
  product_id: number;
  variant_id: number | null;
  quantity: number;
  price: number;
}

/**
 * Get all orders for the current user
 */
export const getOrdersByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: true, message: 'Authentication required' });
      return;
    }

    const orders = await db('orders')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .select('*');

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch orders' });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Require authentication
    if (!userId) {
      res.status(401).json({ error: true, message: 'Authentication required to view order details' });
      return;
    }

    // Build query - only show order if it belongs to the user or user is admin
    const query = db('orders')
      .join('users', 'orders.user_id', 'users.id')
      .select(
        'orders.*',
        'users.name as user_name',
        'users.email as user_email',
        'users.first_name',
        'users.last_name'
      )
      .where('orders.id', orderId);
    
    // If not admin, limit to user's own orders
    if (userRole !== 'admin') {
      query.where('orders.user_id', userId);
    }

    // Get order details
    const order = await query.first();

    if (!order) {
      res.status(404).json({ 
        success: false,
        message: 'Order not found or you do not have permission to view it',
        order: null
      });
      return;
    }

    // Get order items with product details
    const items = await db('order_items as oi')
      .join('products as p', 'oi.product_id', 'p.id')
      .leftJoin('product_variants as pv', 'oi.variant_id', 'pv.id')
      .select(
        'oi.id',
        'oi.product_id',
        'oi.variant_id',
        'oi.quantity',
        'oi.price',
        'p.title',
        db.raw("CASE WHEN pv.id IS NULL THEN NULL ELSE CONCAT(COALESCE(pv.size, ''), ' ', COALESCE(pv.color, '')) END as variant_name"),
        'p.image_url as product_images'
      )
      .where('oi.order_id', orderId);

    // Process items to extract primary image
    const processedItems = items.map(item => {
      let primaryImage = { src: "", alt: "" };
      try {
        let images = [];
        if (item.product_images) {
          if (typeof item.product_images === 'string') {
            try {
              images = JSON.parse(item.product_images);
            } catch (e) {
              // If it starts with http, it might be a direct URL string
              if (typeof item.product_images === 'string' && item.product_images.startsWith('http')) {
                images = [item.product_images];
              }
            }
          } else if (Array.isArray(item.product_images)) {
            images = item.product_images;
          }
        }

        if (images.length > 0) {
          // Check if the first image is an object with src or a direct string URL
          if (typeof images[0] === 'object' && images[0]?.src) {
            primaryImage = { src: images[0].src, alt: item.title };
          } else if (typeof images[0] === 'string') {
            primaryImage = { src: images[0], alt: item.title };
          }
        }
      } catch (err) {
        console.error('Error processing product images for order:', err);
      }
      
      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        variant_name: item.variant_name,
        quantity: item.quantity,
        price: item.price,
        image: primaryImage.src,
        image_alt: primaryImage.alt
      };
    });

    res.status(200).json({
      ...order,
      items: processedItems
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch order details' });
  }
};

/**
 * Create a new order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    // Require authentication
    if (!userId) {
      res.status(401).json({ error: true, message: 'Authentication required to create an order' });
      return;
    }

    const orderData: OrderCreateInput = req.body;
    
    // Validate required fields
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      res.status(400).json({ 
        error: true, 
        message: 'Invalid request parameters', 
        details: { items: 'Order must contain at least one item' }
      });
      return;
    }

    // Verify products and calculate total
    let totalAmount = 0;
    const itemsToProcess: OrderItemToProcess[] = [];

    for (const item of orderData.items) {
      // Fetch product details to get the current price
      const product = await db('products')
        .where('id', item.product_id)
        .select('price')
        .first();

      if (!product) {
        res.status(400).json({
          error: true,
          message: 'Invalid product in order',
          details: { product_id: `Product with ID ${item.product_id} not found` }
        });
        return;
      }

      // Use regular price
      const currentPrice = product.price;

      totalAmount += currentPrice * item.quantity;
      
      itemsToProcess.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        price: currentPrice
      });
    }

    // Extract payment details if provided
    if (orderData.payment_details) {
      // Convert to object if it's a string
      const paymentDetailsObj = typeof orderData.payment_details === 'string' 
        ? JSON.parse(orderData.payment_details) 
        : orderData.payment_details;
      
      // Extract Razorpay details if available
      const razorpayOrderId = paymentDetailsObj.razorpay_order_id;
      const razorpayPaymentId = paymentDetailsObj.razorpay_payment_id;
      
      // Add to order data if available
      if (razorpayOrderId) {
        orderData.razorpay_order_id = razorpayOrderId;
      }
      
      if (razorpayPaymentId) {
        orderData.razorpay_payment_id = razorpayPaymentId;
        // If payment ID is present, likely payment is already completed
        orderData.payment_status = 'paid';
      }
      
      // Save the full payment details
      orderData.payment_details = paymentDetailsObj;
    }

    // Create order transaction
    const result = await db.transaction(async trx => {
      // Create order record
      let orderId;
      try {
        // For PostgreSQL
        const result = await trx('orders').insert({
          user_id: userId,
          status: 'pending',
          total: totalAmount,
          shipping_address: orderData.shipping_address,
          billing_address: orderData.billing_address || orderData.shipping_address,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_status
        }).returning('id');
        
        orderId = result[0].id || result[0]; // Handle both object and scalar responses
      } catch (error) {
        console.error("Error inserting order:", error);
        throw new Error("Failed to create order in database");
      }

      if (!orderId) {
        throw new Error("Failed to get order ID after insertion");
      }

      // Create order items
      const orderItems = itemsToProcess.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price
      }));

      await trx('order_items').insert(orderItems);

      // Get full order details
      const order = await trx('orders').where('id', orderId).first();
      
      // Get order items with product details
      const items = await trx('order_items as oi')
        .join('products as p', 'oi.product_id', 'p.id')
        .leftJoin('product_variants as pv', 'oi.variant_id', 'pv.id')
        .select(
          'oi.id',
          'oi.product_id',
          'oi.variant_id',
          'oi.quantity',
          'oi.price',
          'p.title',
          db.raw("CASE WHEN pv.id IS NULL THEN NULL ELSE CONCAT(COALESCE(pv.size, ''), ' ', COALESCE(pv.color, '')) END as variant_name"),
          'p.image_url as product_images'
        )
        .where('oi.order_id', orderId);

      // Process items to extract primary image
      const processedItems = items.map(item => {
        let primaryImage = { src: "", alt: "" };
        try {
          let images = [];
          if (item.product_images) {
            if (typeof item.product_images === 'string') {
              try {
                images = JSON.parse(item.product_images);
              } catch (e) {
                // If it starts with http, it might be a direct URL string
                if (typeof item.product_images === 'string' && item.product_images.startsWith('http')) {
                  images = [item.product_images];
                }
              }
            } else if (Array.isArray(item.product_images)) {
              images = item.product_images;
            }
          }

          if (images.length > 0) {
            // Check if the first image is an object with src or a direct string URL
            if (typeof images[0] === 'object' && images[0]?.src) {
              primaryImage = { src: images[0].src, alt: item.title };
            } else if (typeof images[0] === 'string') {
              primaryImage = { src: images[0], alt: item.title };
            }
          }
        } catch (err) {
          console.error('Error processing product images for order:', err);
        }
        
        return {
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: item.title,
          variant_name: item.variant_name,
          quantity: item.quantity,
          price: item.price,
          image: primaryImage.src,
          image_alt: primaryImage.alt
        };
      });

      return {
        ...order,
        items: processedItems
      };
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: result
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: true, message: 'Failed to create order' });
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Require authentication
    if (!userId) {
      res.status(401).json({ error: true, message: 'Authentication required to update order' });
      return;
    }
    
    const { status, payment_status }: Partial<{ status: string, payment_status: string }> = req.body;

    // Check if order exists
    let order = await db('orders')
      .where('id', orderId)
      .first();

    if (!order) {
      res.status(404).json({ 
        success: false, 
        message: 'Order not found',
        order: null
      });
      return;
    }

    // If not admin, check if order belongs to user
    if (userRole !== 'admin' && order.user_id !== userId) {
      res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this order',
        order: null
      });
      return;
    }

    // Update order
    const updateData: any = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'No update data provided',
        order: order
      });
      return;
    }

    await db('orders')
      .where('id', orderId)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      });

    // Get updated order data
    const updatedOrder = await db('orders')
      .where('id', orderId)
      .select('id', 'status', 'payment_status', 'updated_at')
      .first();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: true, message: 'Failed to update order' });
  }
};

/**
 * Get all orders (admin only)
 */
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Admin check is removed for development

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get orders
    const orders = await db('orders')
      .join('users', 'orders.user_id', 'users.id')
      .select(
        'orders.id',
        'orders.status',
        'orders.total',
        'orders.payment_method',
        'orders.payment_status',
        'orders.created_at',
        'orders.updated_at',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('orders.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db('orders').count('id as count');

    res.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        pages: Math.ceil(parseInt(count as string) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch orders' });
  }
}; 