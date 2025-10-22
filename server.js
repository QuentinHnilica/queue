// server.js
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const exphbs = require("express-handlebars");
const path = require("path");
const morgan = require("morgan");

const routes = require("./controllers");
const fetchMetaData = require("./controllers/Middleware/metaDataMiddleware");

const sequelize = require("./config/connection");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const { prepareFormTokens } = require("./controllers/Middleware/antiSpam");

const { PARTIALSDIR, LAYOUTDIR, PUBLICFOLDER, VIEWSFOLDER, NODE_ENV, UPLOADSDIR } =
  process.env;

const app = express();
const PORT = process.env.PORT || 3004;

/* ----------------------------- View engine ----------------------------- */
const hbs = exphbs.create({
  extname: ".handlebars",
  partialsDir: PARTIALSDIR,
  layoutsDir: LAYOUTDIR,
  helpers: {
    json: (context) => JSON.stringify(context),
    ifEquals: (a, b, opts) => (a == b ? opts.fn(this) : opts.inverse(this)),
    isSelected: (id, selected) => selected && selected.includes(String(id)),
    includes: (str, sub) =>
      typeof str === "string" && typeof sub === "string"
        ? str.includes(sub)
        : false,
    eq: (a, b) => a === b,
    or: (a, b) => a || b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    range: (start, end) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i),
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case "==":
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case "===":
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case "!=":
          return v1 != v2 ? options.fn(this) : options.inverse(this);
        case "!==":
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case "<":
          return v1 < v2 ? options.fn(this) : options.inverse(this);
        case "<=":
          return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case ">":
          return v1 > v2 ? options.fn(this) : options.inverse(this);
        case ">=":
          return v1 >= v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },
  },
  cache: false, // dev: disable template caching
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set(
  "views",
  VIEWSFOLDER ? path.resolve(VIEWSFOLDER) : path.join(__dirname, "views")
);

/* ----------------------------- Middleware ------------------------------ */
app.set("trust proxy", 1); // if behind proxy/HTTPS terminator (cPanel/Cloudflare/etc.)

app.use(morgan("tiny"));

// IMPORTANT: body parsers must be BEFORE any middleware that reads req.body
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);






// Sessions (Sequelize store)
const sess = {
  secret: process.env.SESSION_SECRET || "Super secret secret even more secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production", // set true in prod over HTTPS
  },
  store: new SequelizeStore({ db: sequelize }),
};
app.use(session(sess));

app.use(prepareFormTokens); // injects {{token}}, {{ts}}, {{hpName}} on ALL GET pages (needed for footer forms)

// Meta-data middleware (runs AFTER body parsers now)
app.use(fetchMetaData);

// Static assets
app.use(express.static(PUBLICFOLDER));
app.use("/uploads", express.static(path.join(UPLOADSDIR)));

app.post("/__echo", (req, res) => {
  res.json({
    ct: req.get("content-type"),
    topKeys: Object.keys(req.body || {}),
    body: req.body,
  });
});


/* -------------------------------- Routes ------------------------------- */
app.use(routes);

// 404
app.use((req, res) => {
  res.status(404).render("notFound");
});

/* ------------------------------- Startup ------------------------------- */
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log(`Now listening on ${PORT}`));
});
