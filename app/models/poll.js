/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PollSchema = new Schema({
  name: String,
  creationDate: Date,
  creator: String,
  admin_password: String,
  user_password: String,
  state: String,
  public_results: Boolean
});

mongoose.model('Poll', PollSchema);


