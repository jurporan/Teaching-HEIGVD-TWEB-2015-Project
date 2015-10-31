/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var QuestionSchema = new Schema({
  text: String,
  choices_available: Number,
  optional: Boolean,
  poll_id: String
});

mongoose.model('Question', QuestionSchema);
