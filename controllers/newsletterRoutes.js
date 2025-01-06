// routes/newsletter.js
const express = require('express');
const router = express.Router();
const Subscriber = require("../modals");
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'mail.queuedevelop.com', // e.g., mail.yourdomain.com
  port: 465,
  secure: true,
  auth: {
    user: 'support@queuedevelop.com',
    pass: 'SuperCoolDude85@!',
  },
});

// Route to handle subscription
router.post('/newsletter/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Save to database
    const subscriber = await Subscriber.create({ email });

    // Send confirmation email
    await transporter.sendMail({
      from: '"Your Website Name" <your-email@yourdomain.com>',
      to: email,
      subject: 'Thank you for subscribing!',
      text: `Hi! Thank you for subscribing to our newsletter.`,
      html: `<p>Hi! Thank you for subscribing to our newsletter.</p>`,
    });

    res.status(200).json({ message: 'Subscription successful!' });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'This email is already subscribed.' });
    } else {
      console.error('Error subscribing:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

module.exports = router;
