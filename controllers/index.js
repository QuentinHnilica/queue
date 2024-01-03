const router = require('express').Router();
const pageRoutes = require('./pageRoutes')

router.use('/', pageRoutes)


module.exports = router