const Message = require('./Message')
// Import models
const User = require("../modals/user");
const Posts = require("../modals/posts")
const MetaData = require("../modals/metadata")
const Newsletter = require("../modals/newsletter")

// Export models
module.exports = {
  User,
  Posts,
  MetaData,
  Message,
  Newsletter
};