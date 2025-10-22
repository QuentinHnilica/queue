// middleware/antiSpam.js
const dns = require("dns").promises;
const rateLimit = require("express-rate-limit");

/* --------------------------- configuration --------------------------- */
const TIMING_MIN_MS = 3000;
const TIMING_MAX_MS = 60 * 60 * 1000;
const ENABLE_MX_CHECK = process.env.NODE_ENV !== "development";

/* ---------------------------- disposable MX -------------------------- */
const DISPOSABLE = new Set([
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
]);

/* ------------------------------- helpers ----------------------------- */
function looksLikeGibberish(str = "") {
  const s = String(str).trim();
  if (s.length < 6) return true;
  const tokens = s.split(/\s+/);
  if (tokens.some((t) => t.length > 40)) return true;
  const letters = (s.match(/[a-z]/gi) || []).length;
  const vowels = (s.match(/[aeiou]/gi) || []).length;
  if (letters && vowels / letters < 0.2 && s.length > 25) return true;
  if (/(.)\1{5,}/.test(s)) return true;
  return false;
}

async function hasMX(domain) {
  try {
    const mx = await dns.resolveMx(domain);
    return Array.isArray(mx) && mx.length > 0;
  } catch {
    return false;
  }
}

const debugBlock = (res, reason, code = 400) => {
  res.set("X-Block-Reason", reason);
  console.warn(
    `[form-block] ${reason} ip=${res.req.ip} ua="${res.req.get(
      "user-agent"
    )}" referer="${res.req.get("referer") || ""}"`
  );
  return res.status(code).send(reason);
};

/** Attempt to normalize bad posts:
 * - urlencoded with a single key that contains a JSON string
 * - urlencoded where the entire object was coerced to "[object Object]"
 * - body.formData provided as a JSON string
 */
function salvageBody(req) {
  const ct = (req.get("content-type") || "").toLowerCase();
  if (!req.body) return;

  // Case A: urlencoded where a single key holds a JSON string,
  // or where the key is literally "object Object"
  if (ct.startsWith("application/x-www-form-urlencoded")) {
    const keys = Object.keys(req.body);
    if (keys.length === 1) {
      const k = keys[0];
      // try parse the key if it looks like JSON
      if (k.startsWith("{") || k.startsWith("[") || k.includes('"formData"')) {
        try {
          req.body = JSON.parse(k);
          return;
        } catch {}
      }
      // try parse the value if it looks like JSON
      const v = req.body[k];
      if (typeof v === "string" && (v.startsWith("{") || v.startsWith("["))) {
        try {
          req.body = JSON.parse(v);
          return;
        } catch {}
      }
      // last resort: parse from the raw body
      if (req.rawBody) {
        const idx = req.rawBody.indexOf("=");
        if (idx >= 0) {
          const maybe = decodeURIComponent(req.rawBody.slice(idx + 1));
          if (maybe.startsWith("{") || maybe.startsWith("[")) {
            try {
              req.body = JSON.parse(maybe);
              return;
            } catch {}
          }
        }
      }
    }
  }

  // Case B: formData present as a JSON string
  if (req.body && typeof req.body.formData === "string") {
    try {
      req.body.formData = JSON.parse(req.body.formData);
    } catch {}
  }
}


function flattenFormData(body) {
  if (!body) return {};
  if (typeof body.formData === "object" && body.formData !== null) {
    return { ...body.formData }; // prefer nested shape (your contract)
  }
  return { ...body }; // fallback if someone posts top-level
}

/* ------------------------------ limiter ------------------------------ */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

/* ---------------------------- main validator ------------------------- */
async function antiSpamValidate(req, res, next) {
  // First: try to salvage common bad encodings
  salvageBody(req);

  // One-shot debug (up to 5 times per session to reduce noise)
  req.session._anti_dbg = (req.session._anti_dbg || 0) + 1;
  if (req.session._anti_dbg <= 5) {
    console.log("[antiSpam IN]", {
      ct: req.get("content-type"),
      rawType: typeof req.body,
      topKeys: Object.keys(req.body || {}),
      hasFD: !!req.body?.formData,
      fdType: typeof req.body?.formData,
      fdKeys: Object.keys((req.body && req.body.formData) || {}),
      tokenInBody: req.body?.formData?.form_token ?? req.body?.form_token,
      tokenInSess: req.session?.formToken,
      hpName: req.session?.hpName,
    });
  }

  if (!req.session) return debugBlock(res, "No session?");

  // If body parser didn’t run, req.body is likely {}. Surface that clearly.
  if (
    !req.body ||
    (typeof req.body === "object" && Object.keys(req.body).length === 0)
  ) {
    return debugBlock(
      res,
      "Empty body (check express.json order / Content-Type: application/json)"
    );
  }

  const data = flattenFormData(req.body);

  // Tokens
  if (!req.session.formToken) {
    return debugBlock(
      res,
      "Missing session token (did you run prepareFormTokens on GET?)"
    );
  }

  const form_token = data.form_token;
  if (!form_token) return debugBlock(res, "Missing form_token");
  if (form_token !== req.session.formToken)
    return debugBlock(res, "Token mismatch");

  // Time trap
  const tsNum = Number(data.form_ts || 0);
  if (!tsNum) return debugBlock(res, "Missing form_ts");
  const elapsed = Date.now() - tsNum;
  if (elapsed < TIMING_MIN_MS)
    return debugBlock(res, `Timing too fast: ${elapsed}ms`);
  if (elapsed > TIMING_MAX_MS)
    return debugBlock(res, `Timing too old: ${elapsed}ms`);

  // JS presence
  if (data.js_enabled !== "1") return debugBlock(res, "JS flag not set");

  // Honeypot
  const hpName = req.session.hpName;
  const hpVal = hpName ? data[hpName] : "";
  if (hpName && hpVal && String(hpVal).trim() !== "")
    return debugBlock(res, "Honeypot hit");

  // Email checks
  const email = String(data.email || "")
    .toLowerCase()
    .trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return debugBlock(res, "Invalid email");
  const domain = email.split("@")[1];
  if (DISPOSABLE.has(domain))
    return debugBlock(res, "Disposable email not allowed");
  if (ENABLE_MX_CHECK) {
    const ok = await hasMX(domain);
    if (!ok) return debugBlock(res, "No MX for domain");
  }

  // Content checks
  const msg = String(data.message || "").trim();
  const links = (msg.match(/https?:\/\//gi) || []).length;
  if (links > 2) return debugBlock(res, "Too many links");
  // if (looksLikeGibberish(msg)) return debugBlock(res, "Message looks like spam");

  return next();
}

/* ----------------------- token preparation (GET) ---------------------- */
function prepareFormTokens(req, res, next) {
  if (req.method !== "GET") return next();
  const accept = (req.get("accept") || "").toLowerCase();
  if (!accept.includes("text/html")) return next();

  // 🚫 skip obvious non-pages to avoid accidental regeneration
  if (
    /^\/(assets|uploads|favicon\.ico|__echo|api\/|\.well-known)/i.test(req.path)
  )
    return next();
  if (/\.(json|xml|rss)$/i.test(req.path)) return next();

  if (!req.session) return next();

  const crypto = require("crypto");

  // ✅ only set if missing or too old (e.g., > 2 hours)
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2h
  const hasFresh =
    req.session.formToken &&
    req.session.formTs &&
    now - Number(req.session.formTs) < maxAge;

  if (!hasFresh) {
    // keep the previous token around to tolerate overlap
    req.session.prevFormToken = req.session.formToken || null;
    req.session.formToken = crypto.randomBytes(16).toString("hex");
    req.session.formTs = now;
    req.session.hpName = "hp_" + Math.random().toString(36).slice(2, 9);
  }

  // expose to templates
  res.locals.token = req.session.formToken;
  res.locals.ts = req.session.formTs;
  res.locals.hpName = req.session.hpName;

  next();
}


module.exports = {
  contactLimiter,
  antiSpamValidate,
  prepareFormTokens,
};
