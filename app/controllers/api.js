// We include everything we need, the express framework, mongoose and the models
var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Poll = mongoose.model('Poll'),
  Question = mongoose.model('Question'),
  Instance = mongoose.model('Instance');

// This function is useful to fetch a Poll object with just its ID
function getPollById(id, callback, pass) {
  var response = {};
  Poll.findById(id, function (err, poll) {
    if (err) callback({reason: "Couldn't find the specified poll"}, null);
    response.id = poll._id;
    response.name = poll.name;
    response.creator = poll.creator;
    response.creation_date = poll.creationDate;
    response.state = poll.state;
    response.protected = (poll.user_password == undefined ? false : true);

    if (pass) {
      response.admin_password = poll.admin_password;
      response.user_password = poll.user_password;
    }

    response.public_results = poll.public_results;

    Question.count({poll_id: id}, function (err, nbQuestions) {
      if (err) callback({reason: "Couldn't count questions in the poll"}, null);
      response.nb_questions = nbQuestions;
      Instance.count({poll_id: id}, function (err, nbInstances) {
        if (err) callback({reason: "Couldn't count instances in the poll"}, null);
        response.nb_instances = nbInstances;
        callback(null, response);
      });
    });
  });
}

// Used to fetch a question by its id
function getQuestionById(id, callback, pass) {
  var question = {};
  Question.findById(id, function (err, quest) {
    if (err) return callback({reason: "Couldn't find the specified question"}, null);
    question.id = quest._id;
    question.text = quest.text;
    question.choices_available = quest.choices_available;
    question.optional = quest.optional;
    question.choices = [];
    quest.choices.forEach(function (choice, idx, arr) {
      var ch = {text: choice.text};
      if (pass) ch.correct = choice.correct;
      question.choices.push(ch);
      if (idx === arr.length - 1) {
        return callback(null, question);
      }
    });
  });
}

// This function is useful to fetch all the questions for a specific poll
function getQuestionsByPoll(id, callback) {
  var response = [];

  // We perform the search
  Question.find({poll_id: id}, function (err, qs) {
    if (err) throw err;
    if (!qs) callback(null, 404);

    // We handle every question in it
    qs.forEach(function (q, qidx, qarr) {
      console.log(q);
      var question = {};
      question.id = q._id;
      question.text = q.text;
      question.choices_available = q.choices_available;
      question.optional = q.optional;
      question.choices = [];

      // We can look now for the choices available for this question
      Choice.find({question_id: q._id}, function (err, cs) {
        if (err) throw err;
        if (!cs) callback(null, 404);

        // We handle every choice
        cs.forEach(function (c, cidx, carr) {
          console.log(c);
          var choice = {};
          choice.id = c._id;
          choice.text = c.text;
          question.choices.push(choice);

          // When the last choice of the last question has been stored, we can return the array
          if (qidx == qarr.length - 1 && cidx == carr.length - 1) {
            callback(response);
          }
        });
      });
      response.push(question);
    });
  });
}

// Return if the password is correct or not
function checkPasswordPoll(pollId, pass, typePass, callback) {
  if (pass === undefined) return callback(false);

  // Find the specified poll
  Poll.findById(pollId, function (err, poll) {
    if (err) return callback(false);
    if (poll === null) return callback(false);

    // Get the correct pass
    var correctPass;
    if(typePass === "admin") {
      correctPass = poll.admin_password;
    } else {
      correctPass = poll.user_password;
    }

    // If the given pass is correct
    if (pass === correctPass) {
      return callback(true);
    }
    return callback(false);
  })
}

// Simple constant for the errorCode we will use when the client sends wrong data. The client shouldn't make fun of us, so we send him an "I am a teapot" error.
var errorCode = 418;
var sockets = [];

module.exports = function (app, io) {
  app.use('/api', router);

  io.on('connection', function (socket) {
    sockets.push(socket);
  });
};

// GET requests handlers
router.get('/polls/stats', function (req, res) {

  var response = {};

  // Here, we only need to count the polls
  Poll.count({state: "open"},
    function (err, nb_open) {
      if (err) return res.status(500).send("Couldn't count active Polls");

      Poll.count(
        function (err, nb_total) {
          if (err) return res.status(500).send("Couldn't count Polls");

          // We use the date provided in the URL
          var sinceDate = new Date(req.query.since);
          Poll.count({creationDate: {$gt: sinceDate}},
            function (err, nb_recent) {
              if (err) return res.status(500).send("Couldn't count since a certain date Polls");
              response.nb_open = nb_open;
              response.nb_total = nb_total;
              response.nb_recent = nb_recent;

              res.format(
                {
                  'application/json': function () {
                    res.send(response);
                  }
                });

            });
        });
    });
});

router.get('/polls/:pollid', function (req, res) {
  var response = {};

  // Begin by checking the given pass
  // If the user doesn't give a password we return the payload without pass information
  checkPasswordPoll(req.params.pollid, req.query.pass, req.query.typePass, function (pass) {
    if (req.params.pollid === 'draft' ||
      req.params.pollid === 'open' ||
      req.params.pollid === 'closed') {
      response.polls = [];
      // We search for every poll in the state :type
      Poll.find({state: req.params.pollid}, function (err, polls) {
        if (err) return res.status(500).send("Couldn't found any poll of this type");

        // If there is none, we simply return the empty array
        if (polls.length < 1) {
          return res.send(response);
        }

        var inserted = 0;
        // Otherwise, we get the details of every poll
        polls.forEach(function (poll, idx, arr) {
          getPollById(poll._id, function (err, resp) {
            if (err) return res.status(500).send("Couldn't found any poll");
            response.polls.push(resp);
            inserted++;

            // If we stored every poll available, we can return the result
            if (inserted === arr.length) {
              res.format({
                'application/json': function () {
                  res.send(response);
                }
              });
            }
          }, pass);
        });
      });
    } else {
      getPollById(req.params.pollid, function (err, poll) {
        if (err) return res.status(500).send(err.reason);

        res.format({
          'application/json': function () {
            res.send(poll);
          }
        });
      }, pass);
    }
  });
});

router.get("/polls/:pollid/questions", function (req, res) {
  var response = {questions: []};
  var expectedNbrResp;

  checkPasswordPoll(req.params.pollid, req.query.pass, req.query.typePass, function (pass) {
    Question.count({poll_id: req.params.pollid}, function (err, nbrQ) {
      if (err) return res.status(500).send("Couldn't count number of questions");
      expectedNbrResp = nbrQ;

      var inserted = 0;
      Question.find({poll_id: req.params.pollid}, function (err, questions) {
        if (err) return res.status(500).send("Couldn'f find any questions");
        questions.forEach(function (quest, idx, arr) {
          getQuestionById(quest._id, function (err, question) {
            if (err) return res.status(500).send(err.reason);
            response.questions.push(question);
            inserted++;
            if (inserted === expectedNbrResp) {
              return res.send(response);
            }
          }, pass);
        });
      });
    });
  });
});

router.get('/polls/:pollid/questions/:questionid', function (req, res) {
  res.format({
    'application/json': function () {
      getQuestionById(req.params.questionid, function (err, question) {
        if (err) return res.status(500).send(err.reason);
        res.send(question);
      });
    }
  });
});

router.get('/polls/:pollid/instances', function (req, res) {
  var response = {instances: []};
  Instance.find({poll_id: req.params.pollid}, function (err, instances) {
    if (err) return res.status(500).send("Couldn't find any instances");
    if (instances.length === 0) res.send(response);
    instances.forEach(function (instance, idx, arr) {
      response.instances.push({id: instance._id, name: instance.name});
      if (idx === arr.length - 1) {
        return res.format({
          'application/json': function () {
            res.send(response);
          }
        });
      }
    });
  });
});

router.get('/polls/:pollid/instances/:instanceId', function (req, res) {
  var response = {};

  Instance.findById(req.params.instanceId, function (err, inst) {
    if (err) return res.status(500).send("Couldn't find the specified instance.");
    response.name = inst.name;
    response.participations = inst.participations;

    res.format({
      'application/json': function () {
        res.send(response);
      }
    });
  });
});

router.get('/polls/:pollid/instances/:instanceid/results/questions/:questionid', function (req, res) {
  var response = {};
  var choices = [];
  Question.findById(req.params.questionid, function (err, question) {
    if (err || question === null) return res.status(500).send("Couldn't find the specified question");
    response.text = question.text;
    response.results = [];
    question.choices.forEach(function (choice, idx, arr) {
      response.results.push({
        text: choice.text,
        correct: choice.correct,
        nb_chosen: 0
      });
    });
    Instance.findById(req.params.instanceid, function (err, instance) {
      if (err) return res.status(500).send("Couldn't find the specified instance");
      var nb_anwsers = 0;
      instance.participations.forEach(function (part, idx, arr) {
        if (part.question === question.text) {
          nb_anwsers++;
          response.results.forEach(function (choice, idx, arr) {
            var myChoices = part.choices;
            myChoices.forEach(function (choiceText, idx, arr) {
              if (choiceText === choice.text) {
                choice.nb_chosen++;
              }
            });
          });
        }
        if (idx === arr.length - 1) {
          response.nb_answers = nb_anwsers;
          res.format({
            'application/json': function () {
              res.send(response);
            }
          });
        }
      });
    });
  });
});

// POST requests handlers

router.post('/polls', function (req, res) {
  var data = req.body;
  var badData = new Array();

  // We check that every mandatory field is there and is of the right type
  if (!(typeof data.name === "string")) {
    badData.push("name");
  }
  if (!(typeof data.creator === "string")) {
    badData.push("creator");
  }
  if (!(typeof data.admin_password === "string")) {
    badData.push("admin_password");
  }
  if (!(data.user_password === undefined) && !(typeof data.user_password === "string")) {
    badData.push("user_password");
  }

  // If there are errors, we tell the client
  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }
  // Otherwise, we can store the data
  else {
    var newPoll = new Poll({
      name: data.name,
      creationDate: Date.now(),
      state: "draft",
      creator: data.creator,
      admin_password: data.admin_password,
      user_password: data.user_password,
      public_results: data.public_results
    });

    newPoll.save(function (err, insert) {
      if (err) throw err;
      res.send({id: insert.id});
    });
  }
});

router.post('/polls/:pollid/questions', function (req, res) {
  var data = req.body;
  var badData = new Array();

  // We check that every mandatory field is there and is of the right type
  if (!(typeof data.text === "string")) {
    badData.push("text");
  }
  if (!(typeof data.choices_available === "number")) {
    badData.push("choices_available");
  }
  if (!(typeof data.optional === "boolean")) {
    badData.push("optional");
  }

  // Here, there is an optional field, we check if it is there and is an array
  if (!(data.choices === undefined) && !(Object.getPrototypeOf(data.choices) === Object.getPrototypeOf(Array()))) {
    badData.push("choices");
  }
  else if (!(data.choices === undefined)) {
    // If it is an array, we check the choice structure in it
    for (var index in data.choices) {
      var choice = data.choices[index];
      if (!(typeof choice.text === "string") || !(typeof choice.correct === "boolean")) {
        badData.push("choices");
        break;
      }
    }
  }

  // If there are errors, we tell the client
  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }

  // Otherwise, we can store the data
  else {
    var newQuestion = new Question({
      text: data.text,
      choices_available: data.choices_available,
      optional: data.optional,
      choices: data.choices,
      poll_id: req.params.pollid
    });

    newQuestion.save(function (err, quest) {
      if (err) return res.status(500).send("Couldn't save the specified question");
      res.send({id: quest.id});
    });
  }
});

router.post('/polls/:pollid/questions/:questionid/choices', function (req, res) {
  var data = req.body;
  var badData = new Array();

  // We check that every mandatory field is there and is of the right type
  if (!(typeof data.text === "string")) {
    badData.push("text");
  }
  if (!(typeof data.correct === "boolean")) {
    badData.push("correct");
  }

  // If there are errors, we tell the client
  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }

  // Otherwise, we can store the data
  else {
    var newChoice = new Choice({
      text: data.text,
      correct: data.correct,
      question_id: req.params.questionid
    });
    newChoice.save(function (err, save) {
      if (err) throw err;
      res.send({id: save.id});
    });
  }
});

router.post('/polls/:pollid/instances', function (req, res) {
  var badData = new Array();

  // We check that every mandatory field is there and is of the right type
  if (!(typeof req.body.name === "string")) {
    badData.push("name");
  }

  // If there are errors, we tell the client
  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }

  else {
    var newInstance = new Instance({
      name: req.body.name,
      participations: [],
      poll_id: req.params.pollid
    });
    Poll.findById(req.params.pollid, function (err, poll) {
      if (err) return res.status(500).send("Couldn't find the specified poll.");
      poll.state = 'open';
      poll.save(function (err) {
        if (err) return res.status(500).send("Couldn't save the poll");
        newInstance.save(function (err, save) {
          if (err) res.status(500).send("Couldn't create this instance");
          res.send({id: save.id});
        });
      })
    });
  }
});

router.post('/polls/:pollid/instances/:instanceid/results', function (req, res) {
  var data = req.body;
  var badData = new Array();

  // We check that every mandatory field is there and is of the right type
  if (!(data.results === undefined) && !(Object.getPrototypeOf(data.results) === Object.getPrototypeOf(Array()))) {
    badData.push("results");
  }

  // If there are errors, we tell the client
  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }

  // Otherwise, we can store the data
  else {
    Instance.findById(req.params.instanceid, function (err, inst) {
      if (err) res.status(500).send("Couldn't find the specified instance.");

      sockets.forEach(function (socket, idx, arr) {
        console.log("J'envois a un blaireau");
        socket.emit('updateChart', data.results);
      });

      inst.participations = inst.participations.concat(data.results);
      inst.save();
      res.status(200).send();
    });
  }
});

// PUT requests handlers

router.put('/polls/:pollid', function (req, res) {
  Poll.findOne({_id: req.params.pollid}, function (err, poll) {
    if (err) throw  err;
    poll.name = req.body.name;
    poll.creationDate = req.body.creationDate;
    poll.creator = req.body.creator;
    poll.admin_password = req.body.admin_password;
    poll.user_password = req.body.user_password;
    poll.state = req.body.state;
    poll.public_results = req.body.public_results;
    poll.save();
    res.status(200).send();
  });
});

router.put('/polls/:pollid/questions/:questionid', function (req, res) {
  Question.findById(req.params.questionid, function (err, quest) {
    if (err) return res.status(500).send("Couldn't find the specified question");
    quest.text = req.body.text;
    quest.choices_available = req.body.choices_available;
    quest.optional = req.body.optional;
    quest.choices = req.body.choices;
    quest.save();
    res.status(200).send();
  });
});

router.put('/polls/:pollid/questions/:questionid/choice/:choiceid', function (req, res) {
  Poll.findOne({_id: req.params.pollid}, function (err, poll) {
    if (err) throw  err;
    poll.name = req.body.name;
    poll.creationDate = req.body.creationDate;
    poll.creator = req.body.creator;
    poll.admin_password = req.body.admin_password;
    poll.user_password = req.body.user_password;
    poll.state = req.body.state;
    poll.save();
    res.status(200).send();
  });
});

// DELETE requests handler

router.delete('/polls/:pollid', function (req, res) {
  Question.remove({poll_id: req.params.pollid}).exec();
  Instance.remove({poll_id: req.params.pollid}).exec();
  Poll.findByIdAndRemove(req.params.pollid, function (err) {
    if (err) {
      res.status(500).send("Coudln't delete poll");
    }
  });
  res.status(200).send();
});

router.delete('/polls/:pollid/questions/:questionid', function (req, res) {
  Choice.remove({question_id: req.params.questionid}, function (err) {
    if (err) res.status(500).send("Couldn't delete choices.");
    Question.findByIdAndRemove(req.params.questionid, function (err) {
      res.send();
    });
  });
});

router.delete('/polls/:pollid/instances/:instanceid', function (req, res) {
  Instance.remove({instance_id: req.params.instanceid}, function (err) {
    if (err) res.status(500).send("Couldn't delete instance.");
    Instance.findByIdAndRemove(req.params.instanceid, function (err) {
      res.send();
    });
  });
});

router.delete('/polls/:pollid/questions/:questionid/choice/:choiceid', function (req, res) {
  Choice.findByIdAndRemove(req.params.choiceid, function (err) {
    if (err)throw err;
  });
});
