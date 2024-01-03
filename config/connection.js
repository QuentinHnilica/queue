const Sequelize = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize("queue", "root", "toor", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});

module.exports = sequelize;
