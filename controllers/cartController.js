const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart with product details
exports.getCart = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    
    const cartItems = await Cart.find({ userId: req.session.userId })
      .populate('productId')
      .sort({ createdAt: -1 });
    
    let total = 0;
    cartItems.forEach(item => {
      total += item.productId.price * item.quantity;
    });
    
    res.render('cart', { cartItems, total });
  } catch (err) {
    console.error(err);
    res.render('cart', { cartItems: [], total: 0, error: 'Failed to load cart' });
  }
};

// Add product to cart
exports.addToCart = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }

    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity);

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check stock
    if (product.stock < qty) {
      return res.render('cart', { cartItems: [], total: 0, error: 'Currently the item is out of stock or not enough stock available.' });
    }

    // Remove stock decrement logic from addToCart

    // Check if item already in cart
    let cartItem = await Cart.findOne({ 
      userId: req.session.userId, 
      productId: productId 
    });

    if (cartItem) {
      cartItem.quantity += qty;
      await cartItem.save();
    } else {
      cartItem = new Cart({
        userId: req.session.userId,
        productId: productId,
        quantity: qty
      });
      await cartItem.save();
    }

    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    
    const { cartItemId } = req.params;
    await Cart.findOneAndDelete({ 
      _id: cartItemId, 
      userId: req.session.userId 
    });
    
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.redirect('/cart');
  }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    
    if (quantity <= 0) {
      await Cart.findOneAndDelete({ 
        _id: cartItemId, 
        userId: req.session.userId 
      });
    } else {
      await Cart.findOneAndUpdate(
        { _id: cartItemId, userId: req.session.userId },
        { quantity: parseInt(quantity) }
      );
    }
    
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.redirect('/cart');
  }
}; 