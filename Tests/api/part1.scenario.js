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

var pollData = [
  [ "Mono poll", "The QPoll team", "53cr3tp@$$"],
  [ "Metro poll", "The QPoll team", "53cr3tp@$$"],
  [ "Mega poll", "The QPoll team", "53cr3tp@$$", "hell0w0rld"],
  [ "Megalo poll", "The QPoll team", "53cr3tp@$$"]
];

var questionData = [
  [ "Do you like cheese?", 1, false],
  [ "Do you like chocolate?", 1, false],
  [ "Do you like pepper?", 1, false, [{text : "Yes", correct : false}, {text : "No", correct : false}]]
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

scenario.step('create 3 polls', function(unused) {

  var requests = _.map(pollData, function(data) {
    return this.post({
      url: "/poll",
      body: {
        name : data[0],
        creator : data[1],
        admin_password : data[2],
        user_password : data[3]
      },
      expect: { statusCode: 200 }
    });
  }, this);

  // run HTTP requests in parallel
  return this.all(requests);
});

scenario.step('create 3 questions in each poll', function(response) {

  var polls = response;
  console.log(response[0]);
  var requests = new Array();
  
  for (var index in response)
  {
      var poll = polls[index].body;
      requests = requests.concat(_.map(questionData, function(data) {
        return this.post({
          url: "/poll/" + poll.id + "/question",
          body: {
            text : data[0],
            choices_available : data[1],
            optional : data[2],
            choices : data[3]
          },
          expect: { statusCode: 200 }
        });
      }, this));
  }

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
    
    if (data.body.nb_recent != (stats.nb_recent + pollData.length)) {
    throw new Error("Wrong number of polls");
  }
  else
  {
      console.log(data.body.nb_recent + " = " + stats.nb_recent + " + " + pollData.length + ", everything seems OK");
  }
});

scenario.step('get stats for tomorrow', function(data) {
  
  tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return this.get({
    url : "/poll?since=" + (tomorrow.getMonth() + 1) + "." + tomorrow.getUTCDate() + "." + tomorrow.getFullYear(),
    expect : {
        statusCode : 200,
    }
  });
});

scenario.step('check tomorrow stats', function(data) {
    
    if (data.body.nb_recent > 0) {
    throw new Error("Wrong number of polls");
  }
  else
  {
      console.log("There are " + data.body.nb_recent + " polls created in the future, everything seems OK");
  }
});

module.exports = scenario;
