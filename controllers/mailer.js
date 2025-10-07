// mailer.js
require("dotenv").config();
const nodemailer = require("nodemailer");

/* ------------------------- tiny helpers ------------------------- */
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
  const s = String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function isPlainObject(v) {
  return Object.prototype.toString.call(v) === "[object Object]";
}
function normalizeKey(k) {
  return String(k)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

/* --------- robust JSON parsing from wrapper strings --------- */
function tryParseJsonLoose(raw) {
  if (raw == null || typeof raw !== "string") return null;
  let s = raw.trim();

  if (/%7b|%7d|%22/i.test(s)) {
    try {
      s = decodeURIComponent(s);
    } catch {}
  }
  s = s.replace(/&quot;|&#34;/g, '"');

  const candidates = [];
  candidates.push(s);
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(s.slice(first, last + 1));
  const frag = s.match(/\{[\s\S]*?\}/g);
  if (frag) candidates.push(...frag);

  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      try {
        return JSON.parse(c.replace(/\\"/g, '"'));
      } catch {}
    }
  }
  return null;
}

/* ------------------ env + transporter (465 SMTPS) ------------------ */
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
if (!smtpUser || !smtpPass)
  throw new Error("SMTP_USER/SMTP_PASS not set (or blank/whitespace).");

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

transporter
  .verify()
  .then(() => console.log("[MAIL] SMTP verify OK"))
  .catch((e) => console.error("[MAIL] SMTP verify FAIL:", e));

/* ------------------------- brand settings ------------------------- */
const BRAND = {
  brandName: "Queue Dev Lead",
  logoUrl: "/assets/imgs/queue-logo-sm.png", // use absolute URL for real email clients, or CID
  primary: "#df8327",
  textColor: "#0f172a",
  muted: "#475569",
  bg: "#f8fafc",
  cardBg: "#ffffff",
  footerText: "This notification was sent automatically by your website.",
};

/* -------------------- normalization so ANY form works -------------------- */
function normalizeLead(raw = {}) {
  const lead = raw?.toJSON ? raw.toJSON() : { ...raw };

  // 1) Merge wrapper OBJECTS (e.g., formData: {...})
  for (const [k, v] of Object.entries({ ...lead })) {
    const nk = normalizeKey(k);
    if (
      isPlainObject(v) &&
      (nk === "formdata" ||
        nk === "payload" ||
        nk === "data" ||
        nk === "fields")
    ) {
      Object.assign(lead, v);
      delete lead[k];
    }
  }

  // 2) Parse and merge wrapper STRINGS that contain JSON
  for (const [k, v] of Object.entries({ ...lead })) {
    if (typeof v === "string") {
      const parsed = tryParseJsonLoose(v);
      if (parsed && isPlainObject(parsed)) {
        Object.assign(lead, parsed);
        const nk = normalizeKey(k);
        if (
          nk === "formdata" ||
          nk === "payload" ||
          nk === "data" ||
          nk === "fields"
        ) {
          delete lead[k];
        }
      }
    }
  }

  // 3) If the whole object is a single JSON string, parse it
  if (Object.keys(lead).length === 1) {
    const onlyVal = Object.values(lead)[0];
    const parsed = tryParseJsonLoose(onlyVal);
    if (parsed && isPlainObject(parsed)) {
      for (const k of Object.keys(lead)) delete lead[k];
      Object.assign(lead, parsed);
    }
  }

  // 4) Aliases -> canonical
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
    if (aliasMap[k] && lead[aliasMap[k]] == null) lead[aliasMap[k]] = v;
  }

  if (!lead.source) lead.source = "contact/consult form";
  return lead;
}

/* ---------------- build ordered rows for the details table ---------------- */
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

  // case/space/underscore-insensitive ignore list
  const IGNORE_NORM = new Set([
    "message",
    "source",
    "submitted",
    "timestamp",
    "createdat",
    "updatedat",
    "id",
    "_id",
    "__v",
    "grecaptcharesponse",
    "formdata",
    "formname",
    "form_name",
    "formnametext",
    "form_name_text",
    "payload",
    "data",
    "fields",
  ]);

  const fmtValue = (v) => {
    if (v == null) return "";
    if (Array.isArray(v)) return v.join(", ");
    if (isPlainObject(v)) {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }
    return String(v);
  };

  const rows = [];

  // 1) priority first
  for (const key of PRIORITY) {
    if (lead[key] != null && String(lead[key]).trim() !== "") {
      rows.push([key, fmtValue(lead[key])]);
    }
  }

  // 2) then everything else
  for (const [k, v] of Object.entries(lead)) {
    const nk = normalizeKey(k);
    if (IGNORE_NORM.has(nk)) continue;
    if (PRIORITY.includes(k)) continue;
    const sv = fmtValue(v);
    if (sv.trim() === "") continue;
    rows.push([k, sv]);
  }

  // de-dup by normalized key
  const seen = new Set();
  const deduped = [];
  for (const [k, v] of rows) {
    const nk = normalizeKey(k);
    if (seen.has(nk)) continue;
    seen.add(nk);
    deduped.push([k, v]);
  }
  return deduped;
}

/* ------------------------ HTML/Text email renderer ------------------------ */
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

  const detailsRows = buildDetailsRows(lead);
  const hasDetails = detailsRows.length > 0;

  const maybeLogoHtml =
    B.logoUrl && /^https?:\/\//i.test(B.logoUrl)
      ? `<img src="${esc(B.logoUrl)}" alt="${esc(
          B.brandName
        )}" width="160" style="display:block;border:0;outline:none;text-decoration:none;max-width:160px;height:auto;">`
      : `<div style="font:600 18px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
          B.textColor
        };">${esc(B.brandName)}</div>`;

  const htmlDetails = hasDetails
    ? detailsRows
        .map(([key, value]) => {
          const label = toLabel(key);
          const valueHtml =
            key.toLowerCase() === "email"
              ? `<a href="mailto:${esc(value)}" style="color:${
                  B.primary
                };">${esc(value)}</a>`
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
        .join("")
    : "";

  const rawDump = !hasDetails
    ? `<div style="margin:14px 0 22px;">
         <div style="font:600 13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:${
           B.muted
         };margin:0 0 6px;" class="dm-muted">Raw Submission</div>
         <pre style="white-space:pre-wrap;word-wrap:break-word;font:400 12px/1.6 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:${
           B.textColor
         };background:${
        B.bg
      };padding:12px 14px;border-radius:10px;border:1px solid #e2e8f0;" class="dm-text dm-bg dm-border">
${esc(JSON.stringify(_lead?.toJSON ? _lead.toJSON() : _lead, null, 2))}
         </pre>
       </div>`
    : "";

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

                ${
                  hasDetails
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 16px;">
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
                       </table>`
                    : rawDump
                }

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

  const textLines = detailsRows.map(([k, v]) => `${toLabel(k)}: ${v}`);
  const text = [
    "You have a new lead",
    `Source: ${lead.source || "contact/consult form"}`,
    "",
    ...(hasDetails
      ? textLines
      : [
          "(Raw Submission follows)",
          JSON.stringify(_lead?.toJSON ? _lead.toJSON() : _lead, null, 2),
        ]),
    "",
    ...(lead.message ? ["Message:", (lead.message || "").trim(), ""] : []),
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");

  return { subject, html, text };
}

/* ----------------------------- public API ----------------------------- */
async function sendLeadNotification({ clientEmail, lead, brand }) {
  const { subject, html, text } = renderLeadEmail(lead, brand);
  return transporter.sendMail({
    from: fromAddr,
    to: clientEmail || process.env.CLIENT_NOTIFY_EMAIL,
    replyTo: (lead && (lead.email || lead?.toJSON?.().email)) || undefined,
    subject,
    text,
    html,
  });
}

module.exports = { sendLeadNotification, transporter };
