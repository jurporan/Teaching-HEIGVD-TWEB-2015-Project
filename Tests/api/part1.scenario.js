var _ = require('underscore');
var copilot = require('api-copilot');
var stats;

var scenario = new copilot.Scenario({
  name: 'TWEB Test for Part 1',
  summary: 'Create poll',
  baseUrl: 'http://localhost:3000/api',
  defaultRequestOptions: {
    json: true
  }
});

var questionData = [
  [ "Do you like cheese?", 1, false],
  [ "Do you like chocolate?", 1, false],
  [ "Do you like pepper?", 1, false, [{text : "Yes", correct : false}, {text : "No", correct : false}]],
];

scenario.step('get stats before insert', function() {

  // make HTTP calls
  return this.get({
    url : '/poll',
    expect : {
        statusCode : 200,
    }
  });
});

scenario.step('store stats before insert', function(data) {

  stats = data.body;
});

scenario.step('create an invalid poll', function() {

  return this.post({
    url: '/poll',
    body: {
        name : "Poll 1",
        creator : "QPoll staff"
    },
    expect : {
        statusCode : 418,
        body : {
            errors : "admin_password"
        }
    }
  });
});

scenario.step('create one poll', function(data) {

  // make HTTP calls
  return this.post({
    url: '/poll',
    body: {
        name : "Poll 1",
        creator : "QPoll staff",
        admin_password : "tweb1234"
    }
  });
});

scenario.step('create 3 questions', function(response) {

  var poll = response.body;

  var requests = _.map(questionData, function(data) {
    return this.post({
      url: "/poll/" + poll.id + "/Question",
      body: {
        text : data[0],
        choices_available : data[1],
        optional : data[2],
        choices : data[3]
      },
      expect: { statusCode: 200 }
    });
  }, this);

  // run HTTP requests in parallel
  return this.all(requests);
});

scenario.step('get stats after insert', function(data) {
  // make HTTP calls
  return this.get({
    url : '/poll',
    expect : {
        statusCode : 200,
    }
  });
});

scenario.step('check stats', function(data) {
    
    console.log("Before insert: " + stats.nb_recent + ", after insert: " + data.body.nb_recent);
    
    if (data.body.nb_recent != (stats.nb_recent + 1)) {
    throw new Error("Wrong number of polls");
  }
  else
  {
      console.log(data.body.nb_recent + " = " + (stats.nb_recent + 1) + ", everything seems OK");
  }
});

module.exports = scenario;
