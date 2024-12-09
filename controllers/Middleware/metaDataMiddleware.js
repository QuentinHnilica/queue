// Required modules
const { MetaData } = require('../../modals'); // Assuming you have a Sequelize model called MetaData

// Middleware to fetch meta data from the database before rendering a page
async function fetchMetaData(req, res, next) {

    console.log("firingMiddleware")
    var pageName = req.path.replace('/', ''); // Assuming the page name matches the route
    if (req.path == '/'){
        pageName = "home"
    }

    try {
        const metaData = await MetaData.findOne({ where: { pageName: pageName } });
        if (metaData) {
            res.locals.metaTitle = metaData.title;
            res.locals.metaKeywords = metaData.Keywords;
        } else {
            res.locals.metaTitle = 'Rig';
            res.locals.metaKeywords = 'Bert';
        }
    } catch (error) {
        console.error('Error fetching meta data from database:', error);
    }

    next();
}

// Export the middleware for use in other files
module.exports = fetchMetaData;