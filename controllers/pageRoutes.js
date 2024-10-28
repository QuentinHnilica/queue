const { Message } = require("../modals");

const router = require("express").Router();

router.get("/", async (req, res) => {
  res.render("home");
});

router.get("/about", async (req, res) => {
  res.render("about");
});

router.get("/contact", async (req, res) => {
  res.render("contact");
});

router.get("/pricing", async (req, res) => {
  res.render("pricing");
});

router.get("/services", async (req, res) => {
  res.render("services");
});

router.get("/seo", async (req, res) => {
  res.render("seofeatures");
});

router.get("/email-features", async (req, res) => {
  res.render("emailfeatures");
});

router.get("/hosting", async (req, res) => {
  res.render("hostingfeatures");
});

router.get("/web-features", async (req, res) => {
  res.render("webfeatures");
});

router.post("/contact/submit", async (req, res) => {
  try {
    console.log(req.body);
    const newMess = await Message.create(req.body);
    res.status(200).json(newMess);
  } catch (err) {
    res.status(400).json(err);
  }
});

// Disclosure Routes
router.get("/privacy", async (req, res) => {
  res.render("privacy");
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

module.exports = router;
