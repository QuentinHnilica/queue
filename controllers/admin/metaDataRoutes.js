const {
    User,
    Posts,
    MetaData,
} = require("../../modals");

const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// same as /admin/metaData
router.get('/metaData', async (req, res) => {

    console.log("I'm getting called")
    const viewsDirectory = path.join(process.cwd(), 'views');

    fs.readdir(viewsDirectory, (err, files) => {
        if (err) {
            console.error('Error reading views directory:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }

        console.log("No erros so far")

        const pages = files
            .filter(file => file.endsWith('.handlebars') && !file.toLowerCase().includes('admin'))
            .map(file => file.replace('.handlebars', ''));

        res.render("adminMetaDataEditor", {
            pages,
        });
    });
});


router.get('/allMetaDataGet', async (req, res) => {
    try {
        //get all meatadata
        const metaDataDB = await MetaData.findAll({})

        // Convert Sequelize instances to plain JavaScript objects
        const myData = metaDataDB.map((post) => post.get({ plain: true }));
        res.json(myData)


    }
    catch (error) {
        console.error(error)
    }
})


// POST route to update meta information for a specific page
router.post('/addNewMeta', async (req, res) => {
    const { page, title, keywords } = req.body;

    if (!page || !title || !keywords) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const newData = await MetaData.create({
            pageName: page,
            title: title,
            Keywords: keywords
        })

        res.status(200).json(newData);
    }
    catch (error) {
        console.error(error)
    }
});


// PUT route to update meta information for a specific page
router.put('/update-meta', async (req, res) => {
    const { page, title, keywords } = req.body;

    if (!page || !title || !keywords) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const newData = await MetaData.update(
            {
                pageName: page,
                title: title,
                Keywords: keywords,
            }, // Data to update
            { where: { pageName: page } } // Condition for update (where clause)
        );
        console.log(newData)
        res.status(200).json(newData);
    }
    catch (error) {
        console.error(error)
    }
});


module.exports = router;