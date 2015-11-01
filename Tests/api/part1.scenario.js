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

// Here are the polls we are going to create
var pollData = [
  [ "Mono poll", "The QPoll team", "53cr3tp@$$"],
  [ "Metro poll", "The QPoll team", "53cr3tp@$$"],
  [ "Mega poll", "The QPoll team", "53cr3tp@$$", "hell0w0rld"],
  [ "Megalo poll", "The QPoll team", "53cr3tp@$$"]
];

// Here are the questions we are going to insert in the polls
var questionData = [
  [ "Do you like cheese?", 1, false],
  [ "Do you like chocolate?", 1, false],
  [ "Do you like pepper?", 1, false, [{text : "Yes", correct : false}, {text : "No", correct : false}]]
];

var insertedPolls = [];

scenario.step('get stats before insert', function() {

  // make HTTP calls
  return this.get({
    url : '/poll',
    expect : {
        statusCode : 200
    }
  });
});

scenario.step('store stats before insert', function(data) {

  stats = data.body;
});

scenario.step('create an invalid poll', function(unused) {

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
  var requests = new Array();
  
  for (var index in response)
  {
      var poll = polls[index].body;
      insertedPolls.push(polls[index].body.id);
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

scenario.step('get stats after insert', function(unused) {
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

scenario.step('get stats for tomorrow', function(unused) {
  
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

scenario.step('get drafts/open/closed', function(unused) {
    
return this.all([
    this.get({url : '/polls/draft', expect : {statusCode : 200}})
  ]);
});

scenario.step('check draft/open/closed', function(data) {

    console.log("Drafts: " + data[0].body.polls.length + ", should be " + (stats.nb_recent + pollData.length));
    //console.log("Open: " + data[1].body.polls.length + ", should be " + stat.nb_open);
    //console.log("Closed: " + data[2].body.polls.length + ", should be " + stat.nb_open);
    
    for (var index in insertedPolls)
    {
        var pollid = insertedPolls[index];
        var pollindex = data[0].body.polls.indexOf(pollid);
        if ( pollindex == -1)
        {
            throw new Error("Poll " + pollid + "not found");
        }
    }
    
    console.log("Found all " + insertedPolls.length + " polls");
});

scenario.step('get the questions of each polls', function(unused) {

  var requests = _.map(insertedPolls, function(id) {
    return this.get({
      url: "/poll/" + id + "/questions",
      expect: { statusCode: 200 }
    });
  }, this);

  // run HTTP requests in parallel
  return this.all(requests);
});

scenario.step('check the number of questions of each polls', function(response) {
    
    for (var index in response)
    {
        var questions = response[index].body.questions;
        if (questions.length != questionData.length)
        {
            throw new Error("Question error");
        }
        else
        {
            for (var qindex in questions)
            {
                if (questions[qindex].choices.length == (questionData[qindex][3] == undefined? 0 : questionData[qindex][3].length))
                {
                    console.log("Question contains " + questions[qindex].choices.length + " choices, should contain " + (questionData[qindex][3] == undefined? "0" : questionData[qindex][3].length) + ", seems ok");
                }
                else
                {
                    throw new Error("Wrong number of choices error");
                }
            }
        }
    }
    
    console.log("Found all " + questionData.length + " questions");
});

module.exports = scenario;
