const { User, Posts } = require("../modals");
const router = require("express").Router();
const { Op } = require("sequelize"); // <-- important

// BLOG LIST (server-side search + pagination)
router.get("/blog", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = 12;
    const q = (req.query.q || "").trim();

    // WHERE: active + optional LIKE search
    const where = { active: true };
    if (q) {
      where[Op.or] = [
        { subject: { [Op.like]: `%${q}%` } },
        { username: { [Op.like]: `%${q}%` } },
        { PostContent: { [Op.like]: `%${q}%` } },
      ];
    }

    // ORDER: prefer 'date' if your model has it; otherwise fallback to PostId
    const order =
      Posts.rawAttributes && Posts.rawAttributes.date
        ? [["date", "DESC"]]
        : [["PostId", "DESC"]];

    const { rows, count } = await Posts.findAndCountAll({
      where,
      order,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const blogPosts = rows.map((r) => r.get({ plain: true }));
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    res.render("blog", {
      blogPosts,
      q,
      baseUrl: process.env.BASE_URL || "https://queuedevelop.com",
      title: res.locals.metaTitle,
      keywords: res.locals.metaKeywords,
      pagination: {
        prev: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : null,
        pages: Array.from({ length: totalPages }, (_, i) => ({
          num: i + 1,
          active: i + 1 === page,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json(err.message);
  }
});

module.exports = router;
