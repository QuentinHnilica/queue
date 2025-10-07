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
function toLabel(key) {
  // split camelCase / snake_case -> "Title Case"
  const s = key.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// ---------- env + transport ----------
const smtpUser = (process.env.SMTP_USER || "").trim();
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
  secure: true,
  auth: { user: smtpUser, pass: smtpPass },
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
  logoUrl: "/assets/imgs/queue-logo-sm.png", // prefer absolute URL or use CID attachment
  primary: "#df8327",
  textColor: "#0f172a",
  muted: "#475569",
  bg: "#f8fafc",
  cardBg: "#ffffff",
  footerText: "This notification was sent automatically by your website.",
};

// ---------- normalization so ANY form works ----------
function normalizeLead(raw = {}) {
  // Flatten one level and copy
  const lead = raw?.toJSON ? raw.toJSON() : { ...raw };

  // Common aliases -> canonical keys
  const aliasMap = {
    full_name: "name",
    fullName: "name",
    phone_number: "phone",
    telephone: "phone",
    business_name: "businessName",
    company: "businessName",
    established_year: "established",
    employees_count: "employees",
    type: "businessType",
    service_type: "service",
    enquiry: "message",
    enquiry_message: "message",
    description_text: "description",
  };
  for (const [k, v] of Object.entries({ ...lead })) {
    if (aliasMap[k] && lead[aliasMap[k]] == null) {
      lead[aliasMap[k]] = v;
    }
  }

  // Add a fallback source
  if (!lead.source) lead.source = "contact/consult form";

  return lead;
}

// Build ordered entries for the details table.
// 1) prioritized keys if present
// 2) then every other key (except ignored)
// Values that are empty/whitespace are skipped.
function buildDetailsRows(lead) {
  const PRIORITY = [
    "name",
    "email",
    "phone",
    "service",
    "businessName",
    "businessType",
    "established",
    "employees",
    "description",
    "budget",
    "timeline",
  ];
  const IGNORE = new Set([
    "message", // rendered separately
    "source", // shown in header area
    "submitted", // we add our own Submitted timestamp
    "timestamp",
    "createdAt",
    "updatedAt",
    "id",
    "_id",
    "__v",
    "g-recaptcha-response",
  ]);

  // helper to stringify non-primitive values safely
  const fmtValue = (v) => {
    if (v == null) return "";
    if (Array.isArray(v)) return v.join(", ");
    if (isObject(v)) {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }
    return String(v);
  };

  const rows = [];

  // 1) prioritized keys
  for (const key of PRIORITY) {
    if (lead[key] != null && String(lead[key]).trim() !== "") {
      rows.push([key, fmtValue(lead[key])]);
    }
  }

  // 2) remaining keys
  for (const [k, v] of Object.entries(lead)) {
    if (IGNORE.has(k)) continue;
    if (PRIORITY.includes(k)) continue;
    const sv = fmtValue(v);
    if (sv.trim() === "") continue;
    rows.push([k, sv]);
  }

  // De-dup any duplicates that slipped in
  const seen = new Set();
  const deduped = [];
  for (const [k, v] of rows) {
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push([k, v]);
  }

  return deduped;
}

// ---------- renderer (dynamic fields) ----------
function renderLeadEmail(_lead, brand = {}) {
  const B = { ...BRAND, ...brand };
  const lead = normalizeLead(_lead);
  const esc = (s) => escapeHtml(String(s || ""));
  const br = (s) => esc(String(s || "")).replace(/\n/g, "<br>");

  const subject = `New Lead: ${
    lead.name || lead.full_name || lead.email || "Website Form"
  }`;
  const preheader = `From ${
    lead.name || lead.full_name || lead.email || "your website contact form"
  }`;

  const detailsRows = buildDetailsRows(lead); // [['name','Quentin'], ['email','...'], ...]

  const maybeLogoHtml =
    B.logoUrl && /^https?:\/\//i.test(B.logoUrl)
      ? `<img src="${esc(B.logoUrl)}" alt="${esc(
          B.brandName
        )}" width="160" style="display:block;border:0;outline:none;text-decoration:none;max-width:160px;height:auto;">`
      : `<div style="font:600 18px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
          B.textColor
        };">${esc(B.brandName)}</div>`;

  const htmlDetails = detailsRows
    .map(([key, value]) => {
      const label = toLabel(key);
      // special links for email/phone
      const valueHtml =
        key.toLowerCase() === "email"
          ? `<a href="mailto:${esc(value)}" style="color:${B.primary};">${esc(
              value
            )}</a>`
          : key.toLowerCase() === "phone"
          ? `<a href="tel:${esc(
              String(value).replace(/[^0-9+]/g, "")
            )}" style="color:${B.primary};">${esc(value)}</a>`
          : esc(value);

      return `
      <tr>
        <td style="padding:10px 0;border-top:1px solid #e2e8f0;width:180px;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${B.textColor};" class="dm-text dm-border">
          ${label}
        </td>
        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${B.textColor};" class="dm-text dm-border">
          ${valueHtml}
        </td>
      </tr>
    `;
    })
    .join("");

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
    <div style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${esc(preheader)}
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${
      B.bg
    };" class="dm-bg">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;">
            <tr>
              <td style="padding:12px 8px 20px 8px;" align="left">
                ${maybeLogoHtml}
              </td>
            </tr>

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
                  A visitor submitted your ${escapeHtml(
                    lead.source || "contact/consult form"
                  )}.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 16px;">
                  ${htmlDetails}
                  <tr>
                    <td style="padding:10px 0;border-top:1px solid #e2e8f0;width:180px;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                      B.textColor
                    };" class="dm-text dm-border">
                      Submitted
                    </td>
                    <td style="padding:10px 0;border-top:1px solid #e2e8f0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                      B.textColor
                    };" class="dm-text dm-border">
                      ${escapeHtml(new Date().toLocaleString())}
                    </td>
                  </tr>
                </table>

                ${
                  lead.message
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
                    ${br(lead.message)}
                  </div>
                </div>`
                    : ""
                }

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
                  <tr>
                    <td>
                      <a class="btn" href="${
                        lead.email ? `mailto:${escapeHtml(lead.email)}` : "#"
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

            <tr>
              <td style="padding:16px 8px 0 8px;" align="left">
                <p style="margin:12px 0 0;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
                  B.muted
                };" class="dm-muted">
                  ${escapeHtml(B.footerText)}
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

  const lines = [];
  for (const [key, value] of detailsRows) {
    lines.push(`${toLabel(key)}: ${value}`);
  }
  const text = [
    "You have a new lead",
    `Source: ${lead.source || "contact/consult form"}`,
    "",
    ...lines,
    "",
    "Message:",
    (lead.message || "").trim(),
    "",
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");

  return { subject, html, text };
}

// ---------- public API ----------
async function sendLeadNotification({ clientEmail, lead }) {
  const safeLead = normalizeLead(lead);

  const { subject, html, text } = renderLeadEmail(safeLead, BRAND);

  // If your logo is relative, you can embed it as CID instead:
  // const attachments = [{
  //   filename: "queue-logo-sm.png",
  //   path: "/absolute/server/path/to/assets/imgs/queue-logo-sm.png",
  //   cid: "brandlogo@queue" // use <img src="cid:brandlogo@queue">
  // }];

  return transporter.sendMail({
    from: fromAddr,
    to: clientEmail || process.env.CLIENT_NOTIFY_EMAIL,
    replyTo: safeLead.email || undefined,
    subject,
    text,
    html,
    // attachments,
  });
}

module.exports = { sendLeadNotification, transporter };
