var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new ArticleSchema object
var ArticleSchema = new Schema({
  // The title, link, and summary are String types and must be unique
  title: {
    type: String,
    unique: true
  },
  link: {
    type: String,
    unique: true
  },
  summary: {
    type: String,
    unique: true
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  // The notes array stores ObjectIds.
  // The ref property links these ObjectIds to the Note model to populate the Article with any associated Notes
  notes: [
    {
      // Store ObjectIds in the array
      type: Schema.Types.ObjectId,
      // The ObjectIds refer to the ids in the Note model
      ref: "Note"
    }
  ]
});

// This creates our model from the above schema by using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;

