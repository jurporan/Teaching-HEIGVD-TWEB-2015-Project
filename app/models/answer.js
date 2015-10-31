/**
 * Created by jermoret on 31.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var AnswerSchema = new Schema({
  choice_id: String,
  participant_id: String
});

mongoose.model('Answer', AnswerSchema);
