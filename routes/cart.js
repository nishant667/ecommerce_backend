const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// View cart
router.get('/', cartController.getCart);

// Add to cart
router.post('/add', cartController.addToCart);

// Remove from cart
router.delete('/:cartItemId', cartController.removeFromCart);

// Update quantity
router.put('/:cartItemId', cartController.updateQuantity);

module.exports = router; 