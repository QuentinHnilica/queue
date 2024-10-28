const {
    Message,
    Product,
    Category,
    SubCategory,
    ProductSubCategory,
    User,
} = require("../../modals");

const router = require("express").Router();
const bcrypt = require("bcrypt");
const saltRounds = 15;
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { where } = require("sequelize");

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const dir = "./public/assets/uploads";
//         if (!fs.existsSync(dir)) {
//             fs.mkdirSync(dir); // Create the uploads directory if it doesn't exist
//         }
//         cb(null, dir); // Store files in the uploads directory
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         cb(null, uniqueSuffix + path.extname(file.originalname)); // Save file with unique name
//     },
// });

// const upload = multer({
//     storage: storage,
//     limits: { files: 5 },

// }).array('productImages', 5)

//this is the same as /admin
router.get("/", async (req, res) => {
    if (req.session.logged_in) {
        res.render("adminPanel");
    } else {
        res.render("login");
    }
});



router.get("/addProduct", async (req, res) => {
    try {
        const categoriesDb = await Category.findAll();
        const categories = categoriesDb.map((category) =>
            category.get({ plain: true }),
        );

        const subCategoriesDb = await SubCategory.findAll();
        const subCategories = subCategoriesDb.map((sub_category) =>
            sub_category.get({ plain: true }),
        );
      

        const uploadsDir = "./public/assets/uploads";
        const files = fs.readdirSync(uploadsDir);

        // Filter only image files (e.g., .jpg, .png)
        const imageFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
        console.log(imageFiles)
        res.render("addProduct", { categories, subCategories, images: imageFiles, });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal server error");
    }
});

router.get("/editProduct/:id", async (req, res) => {
    try {
        const productDb = await Product.findByPk(req.params.id, {
            include: [
                {
                    model: Category, // Include the Category model
                },
                {
                    model: SubCategory, // Include the SubCategory model through ProductSubCategory
                    through: {
                        model: ProductSubCategory, // This is the join table model
                        attributes: [], // Exclude attributes from the join table, optional
                    },
                },
            ],
        });

        // instance of product to plain JavaScript objects
        const product = productDb.get({ plain: true });
        const categoriesDb = await Category.findAll();
        const categories = categoriesDb.map((category) =>
            category.get({ plain: true }),
        );


        const uploadsDir = "./public/assets/uploads";
        const files = fs.readdirSync(uploadsDir);

        // Filter only image files (e.g., .jpg, .png)
        const imageFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
        console.log(imageFiles)

        console.log(product);
        res.render("editProduct", {
            product,
            categories,
            images: imageFiles,
        });
    } catch (error) {
        res.status(400).json(err);
    }
});

router.post("/addProduct/submit", async (req, res) => {
    try {
        console.log(req.body);
        const newProd = await Product.create(req.body);
        res.status(200).json(newProd);
    } catch (err) {
        res.status(400).json(err);
        console.log(err);
    }
});

router.post("/addProduct/newCategory", async (req, res) => {
    try {
        console.log(req.body);
        const newCategory = await Category.create(req.body);
        res.status(200).json(newCategory);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.post("/addProduct/newSubCategory", async (req, res) => {
    try {
        console.log("Incoming request body:", req.body);

        if (!req.body.subCategoryName || !req.body.category_id) {
            console.error("Missing required fields in request body.");
            return res.status(400).json({
                error: "Missing required fields: subCategoryName or category_id",
            });
        }

        // Create new subcategory
        const newSubCategory = await SubCategory.create({
            subCategoryName: req.body.subCategoryName,
            category_id: req.body.category_id,
        });

        console.log("Created new subcategory:", newSubCategory);
        res.status(200).json(newSubCategory);
    } catch (err) {
        console.error("Error creating subcategory:", err);
        res.status(400).json(err);
    }
});

router.post("/addProduct/associateCategoryWithProduct", async (req, res) => {
    const { category_id, product_id } = req.body;

    try {
        // Validate that both category_id and product_id are provided
        if (!category_id || !product_id) {
            return res
                .status(400)
                .json({ message: "Category ID and Product ID are required." });
        }

        // Step 1: Find the product by its name
        const product = await Product.findOne({
            where: { id: product_id },
        });

        // Step 2: Check if the product exists
        if (!product) {
            console.error(`Product with name ${productName} not found.`);
            return res.status(404).json({ message: "Product not found." });
        }

        console.log("\n product found !!!!!!: " + product);

        // Step 3: Update the category_id of the product
        await product.update({ category_id: category_id });

        res.status(200).json({
            message: "Category successfully associated with product.",
            product,
        });
    } catch (error) {
        console.error("Error associating category with product:", error);
        res
            .status(500)
            .json({ message: "Failed to associate category with product." });
    }
});

router.post("/addProduct/associateSubCategoryToProduct", async (req, res) => {
    const { sub_category_id, product_id } = req.body;

    try {
        // Validate that both category_id and product_id are provided
        if (!sub_category_id || !product_id) {
            return res
                .status(400)
                .json({ message: "sub_category_id ID and Product ID are required." });
        }

        // Step 1: Find the product by its name
        const product = await Product.findOne({
            where: { id: product_id },
        });

        // Step 2: Check if the product exists
        if (!product) {
            console.error(`Product with name ${productName} not found.`);
            return res.status(404).json({ message: "Product not found." });
        }

        console.log("\n product found !!!!!!: " + product);

        // Step 3: Update the category_id of the product
        await ProductSubCategory.create({
            product_id: product_id,
            sub_category_id: sub_category_id,
        });

        res.status(200).json({
            message: "Category successfully associated with product.",
            product,
        });
    } catch (error) {
        console.error("Error associating category with product:", error);
        res
            .status(500)
            .json({ message: "Failed to associate category with product." });
    }
});







// Update Products Routes

router.get("/inventoryGrid", async (req, res) => {
    try {
        // Fetching all products from the db, including categories and sub-categories
        const productsDb = await Product.findAll({
            include: [
                {
                    model: Category, // Include the Category model
                },
                {
                    model: SubCategory, // Include the SubCategory model through ProductSubCategory
                    through: {
                        model: ProductSubCategory, // This is the join table model
                        attributes: [], // Exclude attributes from the join table, optional
                    },
                },
            ],
        });
        const categoriesDb = await Category.findAll({
            include: [
                {
                    model: SubCategory, // Include the SubCategory model
                    as: "sub_categories", // Use the alias if you've defined one
                },
            ],
        });


        // Mapping the Sequelize model instances to plain JavaScript objects
        const products = productsDb.map((product) => product.get({ plain: true }));

        // Map Sequelize model instances to plain JS objects
        const categories = categoriesDb.map((category) =>
            category.get({ plain: true }),
        );

        console.log(products);
        // Pass the products, categories, and subcategories to the template (shopPage)
        res.render("inventoryGrid", {
            products: products || [],
            categories: categories || [],
        });
    } catch (err) {
        res.status(400).json(err.message);
    }
});

router.put("/editProduct/:id/update", async (req, res) => {
    try {
        const updateProd = await Product.update(
            req.body, // Data to update
            { where: { id: req.params.id } } // Condition for update (where clause)
        );
        res.status(200).json(updateProd);
    } catch (err) {
        res.status(400).json(err);
        console.log(err);
    }
});

router.delete("/editProduct/:id/deleteSub", async (req, res) => {
    try {
        const deleteProd = await ProductSubCategory.destroy({
            where: {
                product_id: req.params.id
            }
        })
        res.status(200).json(deleteProd)
    } catch {
        res.status(400).json(err)
    }
})

router.delete("/editProduct/:id/deleteProduct", async (req, res) => {
    console.log(req.params)
    try {
        const deleteProd = await Product.destroy({
            where: {
                id: req.params.id
            }
        })
        res.status(200).json(deleteProd)
    } catch(err) {
        res.status(400).json(err)
    }
})


router.get("/newUser", async (req, res) => {
   res.render('createUser')
});

router.post('/logout', (req, res) => {
    if (req.session.logged_in) {
      req.session.destroy(() => {
        res.status(204).end();
      });
    } else {
      res.status(404).end();
    };
  });

module.exports = router;