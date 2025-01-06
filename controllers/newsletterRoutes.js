// routes/newsletter.js
const {
    Newsletter,
    User,
} = require("../modals");
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'mail.queuedevelop.com', // e.g., mail.yourdomain.com
  port: 465,
  secure: true,
  auth: {
    user: 'support@queuedevelop.com',
    pass: 'E3^Q9GdmABdP',
  },
});

// Route to handle subscription
router.post('/newsletter/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
      }
  
      const subscriber = await Newsletter.create({ email }); // Save email
      console.log('Subscriber saved:', subscriber);
  
      await transporter.sendMail({
        from: 'your-email@yourdomain.com',
        to: email,
        subject: 'Thank you for subscribing!',
        text: 'Hi! Thank you for subscribing to our newsletter.',
      });
      console.log('Confirmation email sent to:', email);
  
      res.status(200).json({ message: 'Subscription successful!' });
    } catch (error) {
      console.error('Error occurred:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  

module.exports = router;
