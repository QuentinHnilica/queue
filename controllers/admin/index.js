const router = require('express').Router();
const adminRoutes = require('./adminRoutes');
const adminBlogRoutes = require('./adminBlogRoutes')
const adminMetaDataRoutes = require('./metaDataRoutes')

router.use('/', adminRoutes, adminBlogRoutes,adminMetaDataRoutes);



module.exports = router;