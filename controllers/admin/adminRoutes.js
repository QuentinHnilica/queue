const {
    Message,
    User,
} = require("../../modals");

const router = require("express").Router();
const bcrypt = require("bcrypt");
const saltRounds = 15;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

router.get("/", async (req, res) => {
    if (req.session.logged_in) {
        res.render("adminPanel");
    } else {
        res.render("login");
    }
});


router.post('/logout', (req, res) => {
    if (req.session.logged_in) {
      req.session.destroy(() => {
        res.status(204).end();
      });
    } else {
      res.status(404).end();
    };
  });

module.exports = router;