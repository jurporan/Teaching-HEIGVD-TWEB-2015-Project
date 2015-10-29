/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ChoiceSchema = new Schema({
  key: String,
  text: String
});

mongoose.model('Choice', ChoiceSchema);
