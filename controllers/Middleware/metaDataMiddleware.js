// middleware/fetchMetaData.js
const { MetaData } = require("../../modals"); // make sure this path is correct

async function fetchMetaData(req, res, next) {
  try {
    // Normalize path to a pageName like 'home', 'pricing', 'service-area'
    let pageName = req.path.replace(/^\/+|\/+$/g, ""); // trim leading/trailing slashes
    if (!pageName) pageName = "home";

    const meta = await MetaData.findOne({ where: { pageName } });

    // Set locals to match your template keys
    res.locals.title = meta?.title || "Queue Development | Owosso, MI";
    res.locals.description =
      meta?.description ||
      "Driveway-safe dumpster rentals serving Flint, Grand Blanc, and surrounding Michigan areas. Fast delivery, clear pricing.";
    res.locals.keywords =
      meta?.keywords ||
      "dumpster rental Flint, dumpster Genesee County, driveway safe dumpster, 10 yard dumpster, 15 yard dumpster";
  } catch (err) {
    console.error("Error fetching meta data from database:", err);
    // Sensible fallbacks
    res.locals.title = "Pride Dumpster Rentals";
    res.locals.description = "Driveway-safe dumpster rentals in Michigan.";
    res.locals.keywords = "dumpster rental, roll-off, junk removal";
  }

  next();
}

module.exports = fetchMetaData;
