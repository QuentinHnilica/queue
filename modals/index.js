const Message = require('./Message')
// Import models
const User = require("../modals/user");
const Posts = require("../modals/posts")
const MetaData = require("../modals/metadata")

// Export models
module.exports = {
  User,
  Posts,
  MetaData,
  Message
};