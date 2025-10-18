// routes/admin/metaData.js
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const { MetaData } = require("../../modals");

// ---------- helpers ----------
function normalizeRow(row) {
  if (!row) return null;
  const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
  return {
    pageName: plain.pageName,
    title: plain.title || "",
    description: plain.description || "", // new column (optional/migrating)
    keywords: plain.keywords ?? plain.Keywords ?? "", // supports legacy "Keywords"
  };
}

function requireFields(obj, fields) {
  const missing = fields.filter((f) => !obj[f] || String(obj[f]).trim() === "");
  return missing;
}

// ---------- render dashboard (same as /admin/metaData) ----------
router.get("/metaData", async (req, res) => {
  try {
    const viewsDirectory = path.join(process.cwd(), "views");
    fs.readdir(viewsDirectory, (err, files) => {
      if (err) {
        console.error("Error reading views directory:", err);
        return res
          .status(500)
          .json({ success: false, error: "Internal server error" });
      }
      const pages = files
        .filter(
          (file) =>
            file.endsWith(".handlebars") &&
            !file.toLowerCase().includes("admin")
        )
        .map((file) => file.replace(".handlebars", ""));
      res.render("adminMetaDataEditor", { pages });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/allMetaDataGet", async (_req, res) => {
  try {
    const rows = await MetaData.findAll({});
    const normalized = rows.map(normalizeRow);
    res.json(normalized);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch meta data" });
  }
});

// ---------- get one by page (useful for previews / middleware testing) ----------
router.get("/meta/:page", async (req, res) => {
  try {
    const { page } = req.params;
    const row = await MetaData.findOne({ where: { pageName: page } });
    if (!row)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json(normalizeRow(row));
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ---------- create new (add) ----------
router.post("/addNewMeta", async (req, res) => {
  try {
    const { page, title, keywords, description = "" } = req.body || {};
    const missing = requireFields({ page, title, keywords }, [
      "page",
      "title",
      "keywords",
    ]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Prevent duplicates for same pageName
    const existing = await MetaData.findOne({ where: { pageName: page } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Meta for this page already exists. Use update.",
      });
    }

    // Store using legacy "Keywords" if that column exists in your DB.
    const created = await MetaData.create({
      pageName: page,
      title,
      description, // will be ignored gracefully if column not present yet
      Keywords: keywords, // legacy compatibility
      keywords, // if you’ve already renamed the column
    });

    res.status(201).json(normalizeRow(created));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to create meta" });
  }
});

// ---------- update existing ----------
router.put("/update-meta", async (req, res) => {
  try {
    const { page, title, keywords, description = "" } = req.body || {};
    const missing = requireFields({ page, title, keywords }, [
      "page",
      "title",
      "keywords",
    ]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const row = await MetaData.findOne({ where: { pageName: page } });
    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: "No meta found for this page" });
    }

    await row.update({
      // do NOT change pageName here (acts like a PK/unique)
      title,
      description, // ignored if column not present yet
      Keywords: keywords, // legacy
      keywords, // new
    });

    res.status(200).json(normalizeRow(row));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to update meta" });
  }
});

module.exports = router;
