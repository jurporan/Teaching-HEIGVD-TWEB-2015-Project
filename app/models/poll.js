/**
 * Created by jermoret on 29.10.2015.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PollSchema = new Schema({
  title: String,
  creationDate: Date,
  state: String
});

mongoose.model('Poll', PollSchema);

/* New poll
var poll1 = new Poll({
  title: "First poll",
  creationDate: Date.now(),
  state: "open"
});

poll1.save(function(err){
  if(err) throw err;
  console.log("Poll saved successfully");
})*/


