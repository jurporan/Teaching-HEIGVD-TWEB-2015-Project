/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PersonSchema = new Schema({
  participant: String,
  submissionDate: Date
});

mongoose.model('Person', PersonSchema);
