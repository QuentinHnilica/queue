const {
    User,
    Posts,
} = require("../modals");

const router = require("express").Router();
const bcrypt = require("bcrypt");
const saltRounds = 15;
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// adding blog list page route
router.get("/blog", async (req, res) => {
  try {
    // get all active blog posts, newest first
    const blogDB = await Posts.findAll({
      where: { active: true },
      // Option A: order by a date column (replace 'postedDate' with your actual field)
      order: [["date", "DESC"]],
    });

    // Convert Sequelize instances to plain objects
    const blogPosts = blogDB.map((post) => post.get({ plain: true }));

    console.log(blogPosts);
    res.render("blog", {
      blogPosts,
      title: res.locals.metaTitle,
      keywords: res.locals.metaKeywords,
    });
  } catch (err) {
    res.status(400).json(err.message);
  }
});


// adding specfic blog page route
router.get("/blogpost/:id", async (req, res) => {
    try {
        const blogDB = await Posts.findByPk(req.params.id);

        // instance of product to plain JavaScript objects
        const blogPost = blogDB.get({ plain: true });

        if (blogPost.active) {




            const blogPostUrl = 'https://queuedevelop.com/blogpost/' + req.params.id
            console.log(blogPost);
            res.render("blogPage", {
                blogPost,
                blogPostUrl,
                title: res.locals.metaTitle,
                keywords: res.locals.metaKeywords
            });
        }
        else {
            res.render("notFound")
        }
    } catch (error) {
        res.status(400).json(error);
    }
});


module.exports = router;