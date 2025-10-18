const {
    User,
    Posts,
} = require("../../modals");

const router = require("express").Router();


//Blog Tool Routes
router.get("/blogTool", async (req, res) => {
    res.render("adminBlogPoster");
});


router.post('/newPost', async (req, res) => {
    console.log('Im getting called')
    try {
        console.log('calling')
        const newPost = await Posts.create(req.body)
        console.log(newPost)
        res.status(200).json(newPost)
    }
    catch (err) {
        console.log('error')
        console.log(err)
        res.status(err)
    }
})

// adding blog list for admin panel to edit / delete
router.get("/blogpostList", async (req, res) => {
    try {
        //get all blog posts
        const blogDB = await Posts.findAll({})

        // Convert Sequelize instances to plain JavaScript objects
        const blogPosts = blogDB.map((post) => post.get({ plain: true }));

        console.log(blogPosts)
        res.render("adminBlogpostList", {
            blogPosts,
        });
    } catch (err) {
        res.status(400).json(err.message);
    }
});

// DELETE /blogpostList/:id
router.delete('/blogpostList/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Posts.destroy({
      where: { PostId: id }
    });

    if (deleted) {
      res.status(200).json({ message: 'Blog post deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Blog post not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete blog post.', error });
  }
});

router.put('/blogpostList/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const updated = await Posts.update(
      { active: active },
      { where: { PostId: id } }
    );

    if (updated) {
      res.status(200).json({ message: 'Post status updated successfully.' });
    } else {
      res.status(404).json({ message: 'Post not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update post status.', error });
  }
});


// edit specfic blog page route
router.get("/blogpost/:id", async (req, res) => {
    try {
        const blogDB = await Posts.findByPk(req.params.id);
    
        // instance of product to plain JavaScript objects
        const blogPost = blogDB.get({ plain: true });
    
        console.log(blogPost);
        res.render("adminBlogPage", {
          blogPost,
        });
      } catch (error) {
        res.status(400).json(error);
      }
});




// Update blog post
router.put("/editblogPost/:id", async (req, res) => {
    try {
        const updateBlog = await Posts.update(
            req.body, // Data to update
            { where: { PostId: req.params.id } } // Condition for update (where clause)
        );
        res.status(200).json(updateBlog);
    } catch (err) {
        res.status(400).json(err);
        console.log(err);
    }
});

module.exports = router;