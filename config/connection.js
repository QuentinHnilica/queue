const Sequelize = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.SQLDBNAME, process.env.SQLUSER, process.env.SQLPASS, {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});

module.exports = sequelize;
