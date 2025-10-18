const { Message, User, Leads, Posts } = require("../modals");

const router = require("express").Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const { sendLeadNotification } = require("./mailer");

// ✅ Define upload path
const UPLOADS_DIR = path.join("/mnt/data", "uploads");

// ✅ Ensure upload directory exists

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ✅ Multer Storage: Always save to disk first
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "upload_" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
}).array("Images", 5); // Allow up to 5 images





async function fetchLatestPosts(limit = 3) {
  const rows = await Posts.findAll({
    where: { active: true },
    // safest with your current schema: order by id
    order: [["PostId", "DESC"]],
    limit,
    attributes: [
      "PostId",
      "subject", // title
      "excerpt",
      "banner", // cover image path
      "date", // string date
      "username",
    ],
    raw: true,
  });

  // Normalize to fields your homepage expects
  return rows.map((p) => ({
    id: p.PostId,
    title: p.subject,
    excerpt: p.excerpt || "",
    coverImage: p.banner || "/assets/imgs/ourservices_homepage-01-01.webp",
    publishedAt: p.date, // string; consider storing as DATE later
    author: p.username,
    // If your post detail route is /blog/:id, link with the id:
    url: `/blogpost/${p.PostId}`,
  }));
}

router.get("/", async (req, res, next) => {
  try {
    const latestPosts = await fetchLatestPosts(3);
    res.render("home", {
      latestPosts,
      title: res.locals.metaTitle,
      keywords: res.locals.metaKeywords,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/about-us", async (req, res) => {
  res.render("about");
});

router.get("/contact", async (req, res) => {
  res.render("contact");
});

router.get("/Book-A-Demo", async (req, res) => {
  res.render("packageForm");
});

router.get("/products/web-development", async (req, res) => {
  res.render("services");
});

router.get("/shiawassee20", async (req, res) => {
  res.render("shaiawasseecoupon");
});

router.get("/pride", async (req, res) => {
  res.render("pride");
});

// router.get("/services", async (req, res) => {
//   res.render("services");
// });

router.get("/seo", async (req, res) => {
  res.render("seofeatures");
});

router.get("/email-features", async (req, res) => {
  res.render("emailfeatures");
});

router.get("/hosting", async (req, res) => {
  res.render("hostingfeatures");
});

router.get("/queue-ranker", async (req, res) => {
  res.render("ranker");
});

router.get("/web-features", async (req, res) => {
  res.render("webfeatures");
});

router.get("/portfolio", async (req, res) => {
  res.render("portfolio");
});

router.get("/products/web-design", async (req, res) => {
  res.render("webDesign");
});


router.get("/products/web-applications", async (req, res) => {
  res.render("webApplications");
});

router.post("/contact/submit", async (req, res) => {
  try {
    // (Optional) normalize source so your email shows where it came from
    const payload = { ...req.body, source: "contact" };
    const newMess = await Leads.create(payload);

    // try to email the client; don't fail the lead creation if email breaks
    sendLeadNotification({
      clientEmail: process.env.CLIENT_NOTIFY_EMAIL,
      lead: newMess.toJSON ? newMess.toJSON() : newMess,
    }).catch((e) => console.error("Lead email failed:", e));

    res.status(200).json(newMess);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/consult/submit", async (req, res) => {
  try {
    const payload = { ...req.body, source: "consult" };
    const newMess = await Leads.create(payload);

    sendLeadNotification({
      clientEmail: process.env.CLIENT_NOTIFY_EMAIL,
      lead: newMess.toJSON ? newMess.toJSON() : newMess,
    }).catch((e) => console.error("Lead email failed:", e));

    res.status(200).json(newMess);
  } catch (err) {
    res.status(400).json(err);
  }
});

// Disclosure Routes
router.get("/privacy", async (req, res) => {
  res.render("privacy");
});

router.get("/pricing", async (req, res) => {
  res.render("pricing");
});

router.get("/policy", async (req, res) => {
  res.render("policy");
});
router.get("/terms", async (req, res) => {
  res.render("terms");
});
router.get("/accessibility", async (req, res) => {
  res.render("accessibility");
});

// Login Logic

router.post("/login", async (req, res) => {
  try {
    const userData = await User.findOne({
      where: { username: req.body.userName },
    });

    if (!userData) {
      res
        .status(400)
        .json({ message: "Incorrect email or password, please try again" });
      return;
    }

    const validPassword = await userData.checkPassword(req.body.password);

    if (!validPassword) {
      res
        .status(400)
        .json({ message: "Incorrect email or password, please try again" });
      return;
    }

    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;
      res.json({ user: userData, message: "You are now logged in!" });
    });
  } catch (err) {
    res.status(404).json(err);
  }
});

router.use((req, res, next) => {
  const isLoggedIn = req.session.logged_in ? true : false;
  const currentPath = req.path;

  // Pass variables to templates
  res.locals.isLoggedIn = isLoggedIn;
  res.locals.currentPath = currentPath;

  next(); // Proceed to the next middleware or route
});

router.post("/upload", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("❌ Multer Error:", err);
      return res
        .status(400)
        .json({ error: "Upload failed", details: err.message });
    }

    if (!req.files || req.files.length === 0) {
      console.error("❌ No files uploaded.");
      return res.status(400).json({ error: "No images uploaded" });
    }

    try {
      console.log("✅ Files received:", req.files.length);

      // ✅ Process Images Asynchronously (Parallel Processing)
      const filePaths = await Promise.all(
        req.files.map(async (file) => {
          try {
            const optimizedFileName = "optimized_" + file.filename;
            const optimizedPath = path.join(UPLOADS_DIR, optimizedFileName);

            // Read the file into a buffer first
            const fileBuffer = await fs.promises.readFile(file.path);

            // Process in memory
            const optimizedBuffer = await sharp(fileBuffer)
              .rotate()
              .resize(800, 800, { fit: "inside" })
              .jpeg({ quality: 75 })
              .toBuffer();

            // Save the optimized buffer
            await fs.promises.writeFile(optimizedPath, optimizedBuffer);

            // Now unlink safely — no file locking
            await fs.promises.unlink(file.path);

            return `/uploads/${optimizedFileName}`; // change this in your route
          } catch (error) {
            console.error("❌ Sharp Processing Error:", error);
            return null;
          }
        })
      );

      // ✅ Filter out failed uploads
      const validPaths = filePaths.filter((path) => path !== null);

      if (validPaths.length === 0) {
        throw new Error("All image processing failed");
      }

      res.json({ message: "Images uploaded successfully!", paths: validPaths });
    } catch (error) {
      console.error("❌ Image Processing Error:", error);
      res
        .status(500)
        .json({ error: "Image processing failed", details: error.message });
    }
  });
});

router.post("/createMyUser", async (req, res) => {
  try {
    const userData = await User.create(req.body);

    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;

      res.status(200).json(userData);
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
