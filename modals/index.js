const Message = require('./Message')
// Import models
const User = require("../modals/user");
const Posts = require("../modals/posts")
const MetaData = require("../modals/metadata")
const Newsletter = require("../modals/newsletter")
const Leads = require("../modals/leads")

// Export models
module.exports = {
  User,
  Posts,
  MetaData,
  Message,
  Newsletter,
  Leads,
};