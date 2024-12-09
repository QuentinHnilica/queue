const router = require('express').Router();
const pageRoutes = require('./pageRoutes')
const adminRoutes = require("./admin")
const blogRoutes = require("./blogRoutes");

router.use("/", pageRoutes, blogRoutes);
router.use("/admin", adminRoutes)



module.exports = router