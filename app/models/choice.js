/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ChoiceSchema = new Schema({
  text: String,
  correct: Boolean,
  question_id: String
});

mongoose.model('Choice', ChoiceSchema);
