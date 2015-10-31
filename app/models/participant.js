/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ParticipantSchema = new Schema({
  participant: String,
  submissionDate: Date,
  poll_id: String
});

mongoose.model('Participant', ParticipantSchema);
