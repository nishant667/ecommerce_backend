const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create order and initiate payment
router.post('/checkout', orderController.createOrder);

// Process payment success
router.get('/payment/success', orderController.processPayment);

// Handle payment failure
router.get('/payment/failed', orderController.paymentFailed);

// Get user's order history
router.get('/orders', orderController.getUserOrders);

module.exports = router; 