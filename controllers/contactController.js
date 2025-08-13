const path = require('path');

exports.handleContact = (req, res) => {
  // Here you could save the message to DB or send an email, but for now just show confirmation
  res.render('contact-confirmation', {
    name: req.body.name,
    email: req.body.email,
    message: req.body.message
  });
}; 