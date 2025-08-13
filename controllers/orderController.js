const Order = require('../models/Order');
const Cart = require('../models/Cart');
const stripe = require('../config/stripe');
const Product = require('../models/Product');

// Create order and initiate Stripe Checkout
exports.createOrder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }

    // Get user's cart items
    const cartItems = await Cart.find({ userId: req.session.userId })
      .populate('productId');

    if (cartItems.length === 0) {
      return res.redirect('/cart');
    }

    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = cartItems.map(item => {
      const itemTotal = item.productId.price * item.quantity;
      totalAmount += itemTotal;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity
      };
    });

    // Create order in database (status: pending)
    const order = new Order({
      userId: req.session.userId,
      items: orderItems,
      totalAmount: totalAmount,
      status: 'pending'
    });
    await order.save();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.productId.name,
            description: item.productId.description
          },
          unit_amount: item.productId.price * 100 // Stripe expects amount in paise
        },
        quantity: item.quantity
      })),
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/payment/success?order_id=${order._id}`,
      cancel_url: `${req.protocol}://${req.get('host')}/payment/failed?order_id=${order._id}`
    });

    // Store Stripe session ID in order for reference
    order.paymentId = session.id;
    await order.save();

    // Redirect to Stripe Checkout
    res.redirect(303, session.url);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to create order' });
  }
};

// Handle payment success
exports.processPayment = async (req, res) => {
  try {
    const { order_id } = req.query;
    const order = await Order.findOne({ _id: order_id, userId: req.session.userId });
    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }
    // Check and update stock for each item
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.render('payment-failed', { message: `Payment failed: '${item.name}' is out of stock or not enough stock available.` });
      }
      product.stock -= item.quantity;
      await product.save();
    }
    order.status = 'completed';
    await order.save();
    await Cart.deleteMany({ userId: req.session.userId });
    res.render('payment-success', { order });
  } catch (err) {
    console.error(err);
    res.render('payment-failed', { message: 'Payment failed' });
  }
};

// Handle payment failure
exports.paymentFailed = async (req, res) => {
  try {
    const { order_id } = req.query;
    const order = await Order.findOne({ _id: order_id, userId: req.session.userId });
    if (order) {
      order.status = 'failed';
      await order.save();
    }
    res.render('payment-failed', { message: 'Payment was not successful' });
  } catch (err) {
    console.error(err);
    res.render('payment-failed', { message: 'Payment failed' });
  }
};

// Get user's order history
exports.getUserOrders = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    const orders = await Order.find({ userId: req.session.userId })
      .populate({
        path: 'items.productId',
        select: 'name price imageUrl description'
      })
      .sort({ createdAt: -1 });
    res.render('orders', { orders });
  } catch (err) {
    console.error(err);
    res.render('orders', { orders: [], error: 'Failed to load orders' });
  }
}; 