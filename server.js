const express = require("express");
const routes = require("./controllers");
const session = require("express-session");
const exphbs = require("express-handlebars");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PARTIALSDIR, LAYOUTDIR, PUBLICFOLDER, UPLOADSDIR, VIEWSFOLDER } = process.env;
const fetchMetaData = require('./controllers/Middleware/metaDataMiddleware')
const app = express();

const sequelize = require("./config/connection");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const PORT = process.env.PORT || 3004;

const hbs = exphbs.create({
  extname: ".handlebars",
  partialsDir: PARTIALSDIR,
  layoutsDir: LAYOUTDIR,
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    },

    ifEquals: function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },


    isSelected: function (categoryId, selectedCategories) {
      return (
        selectedCategories && selectedCategories.includes(categoryId.toString())
      );
    },
    includes: function (str, substr) {
      if (typeof str === "string" && typeof substr === "string") {
        return str.includes(substr);
      }
      return false; // Return false if any argument is not a string
    },
    eq: function (a, b) {
      return a === b;
    },
    or: function (a, b) {
      return a || b;
    },
    gt: function (a, b) {
      return a > b;
    },
    range: function (start, end) {
      let rangeArray = [];
      for (let i = start; i <= end; i++) {
        rangeArray.push(i);
      }
      return rangeArray;
    },
    lt: function (a, b) {
      return a < b;
    },
    add: function (a, b) {
      return a + b;
    },
    subtract: function (a, b) {
      return a - b;
    },
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },
  },
  cache: false, // Disable caching in development
});

const sess = {
  secret: "Super secret secret",
  cookie: {}, //change to true when going live
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize,
  }),
};

app.use(session(sess));

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.use(express.static(VIEWSFOLDER));
app.use(fetchMetaData)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLICFOLDER));
app.use(express.static(UPLOADSDIR));

app.use(routes);

const base = "https://api-m.sandbox.paypal.com";
app.use(express.static("client/dist"));
// parse post params sent in body in json format
app.use(express.json());

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

// serve index.html
// app.get("/", (req, res) => {
//     res.sendFile(path.resolve("./client/dist/index.html"));
// });

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
async function generateAccessToken() {
  // To base64 encode your client id and secret using NodeJs
  const BASE64_ENCODED_CLIENT_ID_AND_SECRET = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const request = await fetch(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${BASE64_ENCODED_CLIENT_ID_AND_SECRET}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        response_type: "id_token",
        intent: "sdk_init",
      }),
    }
  );
  const json = await request.json();
  return json.access_token;
}
async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (cart, amt, tax) => {
  // use the cart information passed from the front-end to calculate the purchase unit details
  console.log(
    "shopping cart information passed from the frontend createOrder() callback:",
    cart
  );

  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const fullTotal = amt + tax;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: fullTotal.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: amt.toFixed(2),
            },
            tax_total:{
              currency_code: 'USD',
              value: tax.toFixed(2),
            }
          },
        },
        items: cart.myCartData.map((item) => {
          return {
            name: item.productName,
            unit_amount: {
              currency_code: "USD",
              value: item.price.toFixed(2),
            },
            quantity: item.stockNum,
          };
        }),
      },
    ],
  };
  console.log(payload);

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

app.post("/api/orders", async (req, res) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const cart = req.body.items;
    var total = 0;
    for (i = 0; i < cart.myCartData.length; i++) {
      total += cart.myCartData[i].price * cart.myCartData[i].stockNum;
    }
    var tax = total * 0.06;

    console.log(total);
    const { jsonResponse, httpStatusCode } = await createOrder(
      cart,
      total,
      tax
    );
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only).
      // Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });

  return handleResponse(response);
};

// captureOrder route
app.post("/api/orders/:orderID/capture", async (req, res) => {
  console.log("im here");
  try {
    const { orderID } = req.params;
    console.log(orderID);
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});





app.use((req, res, next) => {
  res.status(404).render("notFound");
});

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log(`Now listening on ${PORT}`));
});

