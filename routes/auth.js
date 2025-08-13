const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

// Registration routes
router.get('/register', (req, res) => {
  res.render('register');
});
router.post('/register', authController.registerUser);

// Login routes
router.get('/login', (req, res) => {
  res.render('login');
});
router.post('/login', authController.loginUser);

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Set session variables for your app
    req.session.userId = req.user._id;
    req.session.username = req.user.username;
    res.redirect('/');
  }
);

// Logout route
router.get('/logout', authController.logoutUser);

// Profile route
router.get('/profile', authController.getProfile);

// Contact Us route
router.post('/contact', require('../controllers/contactController').handleContact);

module.exports = router; 