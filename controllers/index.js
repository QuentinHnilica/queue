const router = require('express').Router();
const pageRoutes = require('./pageRoutes')
const adminRoutes = require("./admin")


router.use("/", pageRoutes);
router.use("/admin", adminRoutes)



module.exports = router