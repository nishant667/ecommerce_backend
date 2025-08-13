require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const passport = require('passport');

const app = express();

// Connect to MongoDB
connectDB();

// Initialize Passport
require('./config/passport');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));
app.use(methodOverride('_method'));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/', orderRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index', { session: req.session });
});

app.listen(3000, () => console.log('Server running'));


