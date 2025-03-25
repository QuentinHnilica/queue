const Sequelize = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.SQLDBNAME, process.env.SQLUSER, process.env.SQLPASS, {
  host: process.env.SQLHOST,
  port: process.env.SQLPORT,
  dialect: process.env.SQLDIALECT,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // necessary for Supabase
    },
  },
});

module.exports = sequelize;
 