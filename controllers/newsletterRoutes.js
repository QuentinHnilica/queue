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
    pass: 's@dMoose85!@#$',
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
      from: "support@queuedevelop.com",
      to: email,
      subject: "Thanks for subscribing!",
      html: `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;background-color:#fefefe;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Queue Development</title>
  </head>
  <body style="font-family:Arial, sans-serif;background-color:#fefefe;margin:0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fefefe;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #ddd;border-radius:8px;padding: 30px;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <h1 style="color:#000000;margin:0;font-size:24px;">
                  Welcome to <span style="color:#df8327;">Queue Development</span> — Where Speed Meets UX
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="color:#000000;font-size:16px;line-height:1.6;padding: 0 20px;">
                <p style="margin-bottom: 16px;">
                  Hey there 👋<br><br>
                  Thanks for subscribing to the <strong>Queue Development Newsletter</strong>.
                </p>
                <p style="margin-bottom: 16px;">
                  Every other week, you’ll get concise, practical insights on:
                </p>
                <ul style="margin:0 0 16px 20px;padding:0;">
                  <li>Improving website speed and Core Web Vitals</li>
                  <li>Design patterns that lift conversions</li>
                  <li>SEO tactics that compound over time</li>
                  <li>Case studies from real client projects</li>
                  <li>Occasional templates, checklists, and tools</li>
                </ul>
                <p style="margin-bottom: 24px;">
                  No fluff—just tactics you can apply this week.
                </p>

                <!-- CTA -->
                <div style="text-align: center; margin: 28px 0;">
                  <a href="https://www.queuedevelop.com/Book-A-Demo"
                     style="background-color:#df8327;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px;display:inline-block;">
                    Book a Demo
                  </a>
                  <div style="height:10px;"></div>
                  <a href="https://www.queuedevelop.com/contact"
                     style="color:#df8327;text-decoration:underline;font-weight:bold;">
                    Start a Project Conversation →
                  </a>
                </div>

                <p style="margin-bottom: 0;">
                  If you ever have a question you want us to cover, just reply to this email—we read every message.
                </p>
              </td>
            </tr>

            <!-- Social / Follow -->
            <tr>
              <td style="padding: 30px 20px 0; text-align: center; font-size: 14px; color: #000000;">
                <p style="margin: 0 0 8px;">Follow us for quick tips and updates:</p>
                <p style="margin: 0;">
                  <a href="https://www.linkedin.com/company/queue-development-llc/" style="color:#df8327;text-decoration:underline;">LinkedIn</a>
                  &nbsp;•&nbsp;
                  <a href="https://www.queuedevelop.com/blog" style="color:#df8327;text-decoration:underline;">Blog</a>
                </p>
              </td>
            </tr>

            <!-- Footer / Unsubscribe -->
            <tr>
              <td style="padding-top: 40px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin-bottom: 4px;">
                  You’re receiving this email because you opted in at Queue Development.
                </p>
                <p style="margin-bottom: 8px;">
                  If you’d rather not receive emails from us, you can
                  <a href="https://www.queuedevelop.com/unsubscribe/${encodeURIComponent(
                    email
                  )}"
                     style="color:#df8327;text-decoration:underline;">unsubscribe here</a>.
                </p>
                <p style="margin: 4px 0;">Queue Development, LLC</p>
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
