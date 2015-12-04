/**
 * Created by jermoret on 13.11.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var InstanceSchema = new Schema({
  name: String,
  participations: [{
    question: String,
    choices: []
  }],
  poll_id: String
});

mongoose.model('Instance', InstanceSchema);
