
var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose');

mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});
var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

require('./config/express')(app, config);

var questions = [];

io.on('connection', function(socket) {
  console.log("A user has connected");
  //socket.emit('updateVotes', questions);
  socket.on('salut', function() {
    console.log("Recu");
  });
});

server.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});
