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
  host: 'mail.privateemail.com', // e.g., mail.yourdomain.com
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
      subject: "Thanks for subscribing!",
      html: `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;background-color:#fefefe;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to SPLYR</title>
  </head>
  <body style="font-family:Arial, sans-serif;background-color:#fefefe;margin:0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fefefe;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #ddd;border-radius:8px;padding: 30px;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <h1 style="color:#000000;margin:0;font-size:24px;">Welcome to <span style="color:#ed1b24;">SPLYR</span> — Smarter Shopping Starts Here</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="color:#000000;font-size:16px;line-height:1.6;padding: 0 20px;">
                <p style="margin-bottom: 16px;">
                  Hey there 👋<br><br>
                  Thanks for joining <strong>SPLYR Trade Post</strong> — your new go-to for curated goods straight from trusted Chinese OEM suppliers.
                </p>
                <p style="margin-bottom: 16px;">
                  We built this platform to help shoppers like you skip inflated retail prices, middlemen, and the headaches of international sourcing.
                </p>
                <p style="margin-bottom: 24px;">
                  As a welcome gift, here’s <strong>10% off your first order</strong>:
                </p>
                <div style="text-align: center; font-size: 20px; font-weight: bold; padding: 12px; background-color: #f2f2f2; border-radius: 6px; margin-bottom: 24px;">
                  🎁 Discount Code: <span style="color:#ed1b24;">SPLYR10</span>
                </div>
                <p style="margin-bottom: 32px; text-align: center;">
                  Use it at checkout — no minimum purchase required.
                </p>
                <div style="text-align: center;">
                  <a href="https://www.splyrtradepost.com" style="background-color:#1dede2;color:#000000;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px;display:inline-block;">
                    Shop Now & Save 10%
                  </a>
                </div>
              </td>
            </tr>

            <!-- New Section: We're Just Getting Started -->
            <tr>
              <td style="padding: 40px 20px 20px; text-align: center; font-size: 16px; color: #000000;">
                <h2 style="font-size:18px; font-weight:bold; margin-bottom: 12px;">We’re Just Getting Started 🚀</h2>
                <p style="margin-bottom: 16px;">
                  SPLYR is starting small — handpicking only the suppliers and products we trust.
                  But we’re adding more OEMs and new finds every day.
                </p>
                <p style="margin-bottom: 0;">
                  Keep checking back for fresh drops, trusted factories, and smarter ways to shop the global supply chain.
                </p>
              </td>
            </tr>

            <!-- Footer / Unsubscribe -->
            <tr>
              <td style="padding-top: 40px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin-bottom: 4px;">You're receiving this email because you signed up for updates from SPLYR Trade Post.</p>
                <p style="margin-bottom: 8px;">
                  If you'd rather not receive emails from us, you can
                  <a href="https://www.queuedevelop.com/unsubscribe/${encodeURIComponent(
        formData.email
      )}" style="color:#ed1b24;text-decoration:underline;">unsubscribe here</a>.
                </p>
                <p style="margin: 4px 0;">SPLYR Trade Post</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
        `,
    });
    console.log('Confirmation email sent to:', email);

    res.status(200).json({ message: 'Subscription successful!' });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


router.get("/unsubscribe/:email", async (req, res) => {
  const email = req.params.email; // ✅ correctly use route param

  if (!email) {
    return res.status(400).send("Email is required.");
  }

  try {
    const lead = await Newsletter.findOne({
      where: {

        email: email,

      },
    });

    if (!lead) {
      return res
        .status(404)
        .send("We couldn't find a subscription with that email.");
    }

    await lead.destroy();

    res.send("You've been unsubscribed successfully.");
  } catch (err) {
    console.error("Unsubscribe error:", err);
    res.status(500).send("An error occurred. Please try again.");
  }
});

router.post('/send-newsletter', async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required.' });
  }

  try {
    // Fetch all subscribers
    const subscribers = await Newsletter.findAll();

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
