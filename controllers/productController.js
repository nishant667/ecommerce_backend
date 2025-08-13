const Product = require('../models/Product');

// Get all products (with optional category and search filtering)
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let filter = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    let query = Product.find(filter);
    // Sorting logic
    if (sort === 'price-asc') query = query.sort({ price: 1 });
    else if (sort === 'price-desc') query = query.sort({ price: -1 });
    else if (sort === 'newest') query = query.sort({ createdAt: -1 });
    else if (sort === 'rating') query = query.sort({ rating: -1 });
    else query = query.sort({ createdAt: -1 });
    const products = await query;
    res.render('products', { products, session: req.session, category, search, sort });
  } catch (err) {
    console.error(err);
    res.render('products', { products: [], error: 'Failed to load products', session: req.session, category: req.query.category, search: req.query.search, sort: req.query.sort });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found', session: req.session });
    }
    res.render('product-detail', { product, session: req.session });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to load product', session: req.session });
  }
}; 