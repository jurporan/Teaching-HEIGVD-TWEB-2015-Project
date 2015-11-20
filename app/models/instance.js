/**
 * Created by jermoret on 13.11.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var InstanceSchema = new Schema({
  participations: [{
    question: String,
    choice: String
  }],
  poll_id: String
});

mongoose.model('Instance', InstanceSchema);
