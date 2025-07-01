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
    pass: '@8HcA71K}Rk6',
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
        from: 'support@queuedevelop.com',
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


  router.post('/send-newsletter', async (req, res) => {
    const { subject, message } = req.body;
  
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }
  
    try {
      // Fetch all subscribers
      const subscribers = await Subscriber.findAll();
  
      if (subscribers.length === 0) {
        return res.status(400).json({ message: 'No subscribers found.' });
      }
  
      // Send emails in batches
      const emailPromises = subscribers.map((subscriber) =>
        transporter.sendMail({
          from: '"Your Website Name" <your-email@yourdomain.com>',
          to: subscriber.email,
          subject,
          html: `<p>${message}</p>`,
        })
      );
  
      await Promise.all(emailPromises);
  
      res.status(200).json({ message: 'Newsletter sent successfully!' });
    } catch (error) {
      console.error('Error sending newsletter:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  

module.exports = router;
