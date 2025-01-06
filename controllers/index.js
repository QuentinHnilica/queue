const router = require('express').Router();
const pageRoutes = require('./pageRoutes')
const adminRoutes = require("./admin")
const blogRoutes = require("./blogRoutes");
const newsletter = require("./newsletterRoutes");

router.use("/", pageRoutes, blogRoutes, newsletter);
router.use("/admin", adminRoutes)



module.exports = router