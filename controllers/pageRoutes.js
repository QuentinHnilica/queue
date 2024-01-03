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

router.post("/contact/submit", async (req, res) => {
  try {
    console.log(req.body);
    const newMess = await Message.create(req.body);
    res.status(200).json(newMess);
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
