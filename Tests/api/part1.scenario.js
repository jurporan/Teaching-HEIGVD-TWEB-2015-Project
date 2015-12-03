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

// We will store the ids of the polls we will create
var insertedPolls = [];

scenario.step('get stats before insert', function() {

  // Simple request for the stats
  return this.get({
    url : '/poll',
    expect : {
        statusCode : 200
    }
  });
});

scenario.step('store stats before insert', function(data) {
  // We store the results for a future use
  stats = data.body;
});

scenario.step('create an invalid poll', function(unused) {

  // We try to create a poll without specifying the admin_password, we expect to receive an error code and one error
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

scenario.step('create 4 polls', function(unused) {

  // We create the polls
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

  // We create 3 questions in each poll, so 12 requests
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

  // We fetch the current stats
  return this.get({
    url : '/poll',
    expect : {
        statusCode : 200,
    }
  });
});

scenario.step('check stats', function(data) {

    // Now we can compare the stats before and after the insertion
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

  // Here we try to get the number of apps that were created since a date in the future, should be empty
  tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return this.get({
    url : "/poll?since=" + (tomorrow.getMonth() + 1) + "." + tomorrow.getUTCDate() + "." + tomorrow.getFullYear(),
    expect : {
        statusCode : 200,
    }
  });
});

scenario.step('check tomorrow stats', function(data) {

    // No apps have been created in the future
    if (data.body.nb_recent > 0) {
    throw new Error("Wrong number of polls");
  }
  else
  {
      console.log("There are " + data.body.nb_recent + " polls created in the future, everything seems OK");
  }
});

scenario.step('get drafts/open/closed', function(unused) {
    // We try to fetch the complete list of polls in each section
return this.all([
    this.get({url : '/polls/draft', expect : {statusCode : 200}}),
    this.get({url : '/polls/open', expect : {statusCode : 200}}),
    this.get({url : '/polls/closed', expect : {statusCode : 200}})
  ]);
});

scenario.step('check draft/open/closed', function(data) {

    // We check the number of polls in each section, Both "open" and "closed" should be equal to the stats before the insertion since we didn't perform a PUT ton change the state of any poll
    console.log("Drafts: " + data[0].body.polls.length + ", should be " + (stats.nb_recent + pollData.length));
    console.log("Open: " + data[1].body.polls.length + ", should be " + stats.nb_open);
    console.log("Closed: " + data[2].body.polls.length + ", should be " + stats.nb_open);

    // If the count don't match, this is an error
    if (data[0].body.polls.length != (stats.nb_recent + pollData.length) || data[1].body.polls.length != stats.nb_open || data[2].body.polls.length != stats.nb_total)
    {
        throw new Error("Wrong poll number");
    }

    // We check that the list contains the polls that we created before
    for (var index in insertedPolls)
    {
        var pollid = insertedPolls[index];
        var pollindex = -1;

        // We search our polls in the list
        for (var pindex in data[0].body.polls)
        {
            if (data[0].body.polls[pindex].id == pollid)
            {
                pollindex = pindex;
                break;
            }
        }

        if ( pollindex == -1)
        {
            throw new Error("Poll " + pollid + "not found");
        }
    }

    console.log("Found all " + insertedPolls.length + " polls");
});

scenario.step('get the questions of each polls', function(unused) {

    // Here we are performing a request to fetch the questions and their choices within the polls
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

    // We check that there are 3 questions
    for (var index in response)
    {
        var questions = response[index].body.questions;
        if (questions.length != questionData.length)
        {
            throw new Error("Question error");
        }
        else
        {
            // We check that the number of choices is correct
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
