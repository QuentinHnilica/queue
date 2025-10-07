require("dotenv").config(); // ensure env is loaded early

const nodemailer = require("nodemailer");

// helper to safely show what's being used
function mask(s) {
  if (!s) return "(empty)";
  const t = s.trim();
  if (t.length <= 4) return "*".repeat(t.length);
  return t.slice(0, 2) + "*".repeat(t.length - 4) + t.slice(-2);
}

const smtpUser = (process.env.SMTP_USER || "").trim(); // FULL mailbox, e.g. no-reply@yourdomain.com
const smtpPass = (process.env.SMTP_PASS || "").trim();
const fromAddr = (process.env.SMTP_USER || "").trim(); // keep From equal to the mailbox on PrivateEmail

console.log("[MAIL] host=mail.privateemail.com port=465 secure=true");
console.log(
  "[MAIL] user=%s pass=%s from=%s",
  mask(smtpUser),
  mask(smtpPass),
  mask(fromAddr)
);

// fail fast if envs are missing
if (!smtpUser || !smtpPass) {
  throw new Error("SMTP_USER/SMTP_PASS not set (or blank/whitespace).");
}

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true, // SMTPS
  auth: {
    user: smtpUser, // MUST be the full mailbox
    pass: smtpPass,
  },
  // Let the server choose; LOGIN usually works, but autodetect avoids mismatches
  // authMethod: "LOGIN",
  tls: {
    minVersion: "TLSv1.2",
    servername: "mail.privateemail.com",
    rejectUnauthorized: true,
  },
});

async function sendLeadNotification({ clientEmail, lead }) {
  const subject = `New Lead: ${
    lead?.name || lead?.full_name || lead?.email || "Website Form"
  }`;
  const text = `You have a new lead...\n${JSON.stringify(lead, null, 2)}`;

  // From should match smtpUser for PrivateEmail deliverability/policy
  return transporter.sendMail({
    from: fromAddr,
    to: clientEmail || process.env.CLIENT_NOTIFY_EMAIL,
    replyTo: lead?.email || undefined,
    subject,
    text,
  });
}

// one-time probe
transporter
  .verify()
  .then(() => console.log("[MAIL] SMTP verify OK"))
  .catch((e) => console.error("[MAIL] SMTP verify FAIL:", e));

// simple helper so routes stay clean
async function sendLeadNotification({ clientEmail, lead }) {
  const safeLead = lead?.toJSON ? lead.toJSON() : lead || {};
  const subject = `New Lead: ${
    safeLead.name || safeLead.full_name || safeLead.email || "Website Form"
  }`;

  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial;max-width:600px;margin:auto">
      <h2 style="margin:0 0 12px">You have a new lead</h2>
      <p><strong>Source:</strong> ${escapeHtml(
        safeLead.source || "contact/consult form"
      )}</p>
      <table style="border-collapse:collapse;width:100%">
        ${row("Name", safeLead.name || safeLead.full_name || "")}
        ${row("Email", safeLead.email || "")}
        ${row("Phone", safeLead.phone || "")}
        ${row("Service", safeLead.service || "")}
        ${row("Message", safeLead.message || "", { allowLineBreaks: true })}
        ${row("Timestamp", new Date().toLocaleString())}
      </table>
      <p style="margin-top:16px;color:#555">Reply directly to this email to contact the lead.</p>
    </div>
  `;

  const text = `You have a new lead
Source: ${safeLead.source || "contact/consult form"}

Name: ${safeLead.name || safeLead.full_name || ""}
Email: ${safeLead.email || ""}
Phone: ${safeLead.phone || ""}
Service: ${safeLead.service || ""}
Message:
${safeLead.message || ""}

Timestamp: ${new Date().toISOString()}`;

  return transporter.sendMail({
    // Keep From = authenticated mailbox for PrivateEmail
    from: process.env.SMTP_USER,
    to: clientEmail || process.env.CLIENT_NOTIFY_EMAIL, // prefer function arg, fallback to env
    replyTo: safeLead.email || undefined,
    subject,
    text,
    html,
  });
}

// helpers
function row(label, value, opts = {}) {
  if (!value) return "";
  const safe = escapeHtml(String(value));
  const rendered = opts.allowLineBreaks ? safe.replace(/\n/g, "<br>") : safe;
  return `
    <tr>
      <td style="padding:6px 8px;border-top:1px solid #eee;width:140px"><strong>${escapeHtml(
        label
      )}</strong></td>
      <td style="padding:6px 8px;border-top:1px solid #eee">${rendered}</td>
    </tr>
  `;
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

module.exports = { sendLeadNotification };
