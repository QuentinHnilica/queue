const { Message, User, Leads } = require("../modals");

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

module.exports = router;
