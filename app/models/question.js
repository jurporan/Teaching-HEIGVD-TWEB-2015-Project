/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var QuestionSchema = new Schema({
  title: String,
  type: String
});

mongoose.model('Question', QuestionSchema);
