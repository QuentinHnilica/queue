// mailer.js
require("dotenv").config();
const nodemailer = require("nodemailer");

// ---------- tiny helpers ----------
function mask(s) {
  if (!s) return "(empty)";
  const t = s.trim();
  if (t.length <= 4) return "*".repeat(t.length);
  return t.slice(0, 2) + "*".repeat(t.length - 4) + t.slice(-2);
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}

// ---------- env + transport ----------
const smtpUser = (process.env.SMTP_USER || "").trim(); // full mailbox
const smtpPass = (process.env.SMTP_PASS || "").trim();
const fromAddr = smtpUser;

console.log("[MAIL] host=mail.privateemail.com port=465 secure=true");
console.log(
  "[MAIL] user=%s pass=%s from=%s",
  mask(smtpUser),
  mask(smtpPass),
  mask(fromAddr)
);

if (!smtpUser || !smtpPass) {
  throw new Error("SMTP_USER/SMTP_PASS not set (or blank/whitespace).");
}

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true, // SMTPS
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  // Let server pick best method; LOGIN often used by PrivateEmail
  // authMethod: "LOGIN",
  tls: {
    minVersion: "TLSv1.2",
    servername: "mail.privateemail.com",
    rejectUnauthorized: true,
  },
});

// (Optional) Verify once at boot
transporter
  .verify()
  .then(() => console.log("[MAIL] SMTP verify OK"))
  .catch((e) => console.error("[MAIL] SMTP verify FAIL:", e));

// ---------- brand config (yours) ----------
const BRAND = {
  brandName: "Queue Dev Lead",
  logoUrl: "/assets/imgs/queue-logo-sm.png", // use absolute URL for email clients
  primary: "#df8327",
  textColor: "#0f172a",
  muted: "#475569",
  bg: "#f8fafc",
  cardBg: "#ffffff",
  footerText: "This notification was sent automatically by your website.",
};

// ---------- renderer ----------
function renderLeadEmail(safeLead, brand = {}) {
  const B = { ...BRAND, ...brand };
  const esc = (s) => escapeHtml(String(s || ""));
  const br = (s) => esc(String(s || "")).replace(/\n/g, "<br>");

  const subject = `New Lead: ${
    safeLead.name || safeLead.full_name || safeLead.email || "Website Form"
  }`;
  const preheader = `From ${
    safeLead.name ||
    safeLead.full_name ||
    safeLead.email ||
    "your website contact form"
  }`;

  const detailsRows = [
    ["Name", safeLead.name || safeLead.full_name],
    ["Email", safeLead.email],
    ["Phone", safeLead.phone],
    ["Service", safeLead.service],
    ["Source", safeLead.source || "contact/consult form"],
    ["Submitted", new Date().toLocaleString()],
  ].filter(([, v]) => v);

  const maybeLogoHtml =
    B.logoUrl && /^https?:\/\//i.test(B.logoUrl)
      ? `<img src="${esc(B.logoUrl)}" alt="${esc(
          B.brandName
        )}" width="160" style="display:block;border:0;outline:none;text-decoration:none;max-width:160px;height:auto;">`
      : `<div style="font:600 18px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
          B.textColor
        };">${esc(B.brandName)}</div>`;

  const html = `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(subject)}</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .dm-bg { background: #0b1220 !important; }
        .dm-card { background: #0f172a !important; }
        .dm-text { color: #e2e8f0 !important; }
        .dm-muted { color: #94a3b8 !important; }
        .dm-border { border-color: #1f2937 !important; }
        .btn { color: #0b1220 !important; }
      }
      a { text-decoration: none; }
      .btn:hover { filter: brightness(0.95); }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${B.bg};" class="dm-bg">
    <!-- Preheader (hidden) -->
    <div style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${esc(preheader)}
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${
      B.bg
    };" class="dm-bg">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;">
            <!-- Header -->
            <tr>
              <td style="padding:12px 8px 20px 8px;" align="left">
                ${maybeLogoHtml}
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background:${
                B.cardBg
              };border-radius:14px;padding:24px;border:1px solid #e2e8f0;" class="dm-card dm-border">
                <h1 style="margin:0 0 12px;font:700 22px/1.25 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                  B.textColor
                };" class="dm-text">
                  You have a new lead
                </h1>
                <p style="margin:0 0 20px;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                  B.muted
                };" class="dm-muted">
                  A visitor submitted your ${esc(
                    safeLead.source || "contact/consult form"
                  )}.
                </p>

                <!-- Details -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 16px;">
                  ${detailsRows
                    .map(
                      ([label, value]) => `
                    <tr>
                      <td style="padding:10px 0;border-top:1px solid #e2e8f0;width:160px;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                        B.textColor
                      };" class="dm-text dm-border">
                        ${esc(label)}
                      </td>
                      <td style="padding:10px 0;border-top:1px solid #e2e8f0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                        B.textColor
                      };" class="dm-text dm-border">
                        ${
                          label === "Email"
                            ? `<a href="mailto:${esc(value)}" style="color:${
                                B.primary
                              };">${esc(value)}</a>`
                            : label === "Phone"
                            ? `<a href="tel:${esc(
                                String(value).replace(/[^0-9+]/g, "")
                              )}" style="color:${B.primary};">${esc(value)}</a>`
                            : esc(value)
                        }
                      </td>
                    </tr>
                  `
                    )
                    .join("")}
                </table>

                ${
                  safeLead.message
                    ? `
                <div style="margin:14px 0 22px;">
                  <div style="font:600 13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                    B.muted
                  };margin:0 0 6px;" class="dm-muted">Message</div>
                  <div style="font:400 14px/1.7 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                    B.textColor
                  };background:${
                        B.bg
                      };padding:12px 14px;border-radius:10px;border:1px solid #e2e8f0;" class="dm-text dm-bg dm-border">
                    ${br(safeLead.message)}
                  </div>
                </div>`
                    : ""
                }

                <!-- CTA -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
                  <tr>
                    <td>
                      <a class="btn" href="${
                        safeLead.email
                          ? `mailto:${escapeHtml(safeLead.email)}`
                          : "#"
                      }"
                         style="display:inline-block;background:${
                           B.primary
                         };color:#ffffff;border-radius:10px;font:600 14px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;padding:12px 16px;border:1px solid ${
    B.primary
  };">
                        Reply to Lead
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 8px 0 8px;" align="left">
                <p style="margin:12px 0 0;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                  B.muted
                };" class="dm-muted">
                  ${esc(B.footerText)}
                </p>
              </td>
            </tr>

            <tr><td style="height:24px">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`.trim();

  const text = [
    "You have a new lead",
    `Source: ${safeLead.source || "contact/consult form"}`,
    "",
    `Name: ${safeLead.name || safeLead.full_name || ""}`,
    `Email: ${safeLead.email || ""}`,
    `Phone: ${safeLead.phone || ""}`,
    `Service: ${safeLead.service || ""}`,
    "",
    "Message:",
    (safeLead.message || "").trim(),
    "",
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");

  return { subject, html, text };
}

// ---------- public API ----------
async function sendLeadNotification({ clientEmail, lead }) {
  const safeLead = lead?.toJSON ? lead.toJSON() : lead || {};
  const { subject, html, text } = renderLeadEmail(safeLead, BRAND);

  // If you want to embed the logo as CID instead of absolute URL:
  // const attachments = [{
  //   filename: "logo.png",
  //   path: "/absolute/path/to/queue-logo-sm.png",
  //   cid: "brandlogo@queue" // and in HTML use: <img src="cid:brandlogo@queue">
  // }];

  return transporter.sendMail({
    from: fromAddr, // must match authenticated mailbox for PrivateEmail
    to: clientEmail || process.env.CLIENT_NOTIFY_EMAIL,
    replyTo: safeLead.email || undefined,
    subject,
    text,
    html,
    // attachments,
  });
}

module.exports = { sendLeadNotification, transporter };
