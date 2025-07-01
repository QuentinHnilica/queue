const { Message, User, Leads } = require("../modals");

const router = require("express").Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// ✅ Define upload path
const UPLOADS_DIR = path.join("/mnt/data", "uploads");

// ✅ Ensure upload directory exists

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ✅ Multer Storage: Always save to disk first
const storage = multer.memoryStorage();
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

router.get("/", async (req, res) => {
  res.render("home");
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

router.post("/contact/submit", async (req, res) => {
  try {
    console.log(req.body);
    const newMess = await Leads.create(req.body);
    res.status(200).json(newMess);
  } catch (err) {
    res.status(400).json(err);
  }
});
router.post("/consult/submit", async (req, res) => {
  try {
    console.log(req.body);
    const newMess = await Leads.create(req.body);
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
            const optimizedBuffer = await sharp(file.buffer)
              .rotate() // Auto-fix orientation
              .resize(800, 800, { fit: "inside" }) // Resize while keeping aspect ratio
              .jpeg({ quality: 75 }) // Optimize quality
              .toBuffer();

            // ✅ Save optimized image
            const filename = `optimized_${Date.now()}_${file.originalname}`;
            const filePath = path.join(UPLOADS_DIR, filename);
            await fs.promises.writeFile(filePath, optimizedBuffer);

            return `/assets/uploads/${filename}`;
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
