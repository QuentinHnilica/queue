const Message = require('./Message')
// Import models
const User = require("../modals/user");
const Posts = require("../modals/posts")
const MetaData = require("../modals/metadata")
const Newsletter = require("../modals/newsletter")
const Leads = require("../modals/leads")
const EmailBlast = require("./emailBlasts")

// Export models
module.exports = {
  User,
  Posts,
  MetaData,
  Message,
  Newsletter,
  Leads,
  EmailBlast,
};