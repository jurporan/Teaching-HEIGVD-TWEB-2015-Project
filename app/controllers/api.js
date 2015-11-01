var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Poll = mongoose.model('Poll'),
  Question = mongoose.model('Question'),
  Participant = mongoose.model('Participant'),
  Choice = mongoose.model('Choice'),
  Answer = mongoose.model('Answer');

function getPollById(id, callback) {
  var response = {};
  Poll.findOne({_id: id}, function (err, poll) {
    if (err) throw err;
    if (!poll) callback(null, 404);
    response.name = poll.name;
    response.creator = poll.creator;
    response.creation_date = poll.creationDate;
    response.state = poll.state;
    Question.count({poll_id: id}, function (err, nb_quest) {
      if (err) throw err;
      response.nb_questions = nb_quest;
      Participant.count({poll_id: id}, function (err, nb_part) {
        if (err) throw err;
        response.nb_participations = nb_part;
        callback(response);
      });
    });
  });
}

function getQuestionsByPoll(id, callback)
{
    var response = [];


    Question.find({poll_id : id}, function (err, qs)
    {
        if (err) throw err;
        if (!qs) callback(null, 404);

        qs.forEach(function(q, qidx, qarr)
        {
            var question = {};
            question.id = q._id;
            question.text = q.text;
            question.choices_available = q.choices_available;
            question.optional = q.optional;
            question.choices = [];
            Choice.find({question_id : q._id}, function (err, cs)
            {
                if (err) throw err;
                if (!cs) callback(null, 404);

                cs.forEach(function (c, cidx, carr)
                {
                    var choice = {};
                    choice.id = c._id;
                    choice.text = c.text;
                    question.choices.push(choice);

                    if (qidx == qarr.length - 1 && cidx == carr.length - 1)
                    {
                        callback(response);
                    }
                });
            });

            response.push(question);
        });
    });
}

var errorCode = 418;
module.exports = function (app) {
  app.use('/api', router);
};

// GET

router.get('/poll/:pollid/question/:questionid/results', function (req, res) {
  var response = {};
  Question.findOne({_id: req.params.questionid}, function (err, quest) {
    if (err) throw err;
    response.text = quest.text;
    response.nb_answers = 0;
    response.results = [];
    Choice.find({question_id: req.params.questionid}, function (err, choices) {
      if (err) throw err;
      choices.forEach(function (choice, idx, arr) {
        Answer.count({choice_id: choice._id}, function (err, nbr) {
          if (err) throw err;
          response.nb_answers += nbr;
          response.results.push({
            id: choice._id,
            text: choice.text,
            correct: choice.correct,
            nb_chosen: nbr
          });
          if (idx === arr.length - 1) {
            res.format(
              {
                'application/json': function () {
                  res.send(response);
                }
              });
          }
        })
      });
    });
  });

});

router.get('/poll/:pollid/question/:questionid', function (req, res) {
  var response = {};
  Question.findOne({_id: req.params.questionid}, function (err, quest) {
    if (err) throw err;
    response.text = quest.text;
    response.choices_available = quest.choices_available;
    response.optional = quest.optional;
    response.choices = [];
    Choice.find({question_id: req.params.questionid}, function (err, choices) {
      if (err) throw err;
      choices.forEach(function (choice, idx, arr) {
        response.choices.push(choice);
        if (idx === arr.length - 1) {
          res.format(
            {
              'application/json': function () {
                res.send(response);
              }
            });
        }
      });
    });
  });

});

router.get("/poll/:pollid/questions", function (req, res) {
    res.format(
    {
      'application/json': function () {
        getQuestionsByPoll(req.params.pollid, function (questionsOfPoll) {
          res.send({questions : questionsOfPoll});
        });
      }
    });
});

router.get('/polls/:type', function (req, res) {
  var response = {polls: []};
  var inserted = 0;
  Poll.find({state: req.params.type}, function (err, polls) {
    if (err) throw err;
    if (polls.length < 1) return res.send(404);

    polls.forEach(function (poll, idx, arr) {
      getPollById(poll._id, function (resp, err) {
        if (err) throw err;
        response.polls.push(resp);
        inserted++;
        if (inserted === arr.length) {
          res.format(
            {
              'application/json': function () {
                res.send(response);
              }
            });
        }
      });
    });
  })
});

router.get('/poll/:pollid', function (req, res) {
  res.format(
    {
      'application/json': function () {
        getPollById(req.params.pollid, function (poll) {
          res.send(poll);
        });
      }
    });
});

router.get('/poll', function (req, res) {

  var response = {};
  Poll.count({state: "active"},
    function (err, nb_open) {
      if (err) throw next(err);

      Poll.count({state: "closed"},
        function (err, nb_closed) {
          if (err) throw err;

          var sinceDate = new Date(req.query.since);
          Poll.count({creationDate: {$gt: sinceDate}},
            function (err, nb_recent) {
              if (err) throw err;
              response.nb_open = nb_open;
              response.nb_closed = nb_closed;
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

// POST
router.post('/poll', function (req, res) {
  var data = req.body;
  var badData = new Array();

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

  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }
  else {
    var newPoll = new Poll({
      name: data.name,
      creationDate: Date.now(),
      state: "draft",
      creator: data.creator,
      admin_password: data.admin_password,
      user_password: data.user_password
    });

    newPoll.save(function (err, insert) {
      if (err) throw err;
      res.send({id: insert.id});
    });
  }
});

router.post('/poll/:pollid/question', function (req, res) {
  var data = req.body;
  var badData = new Array();

  if (!(typeof data.text === "string")) {
    badData.push("text");
  }
  if (!(typeof data.choices_available === "number")) {
    badData.push("choices_available");
  }
  if (!(typeof data.optional === "boolean")) {
    badData.push("optional");
  }
  if (!(data.choices === undefined) && !(Object.getPrototypeOf(data.choices) === Object.getPrototypeOf(Array())))
  {
      badData.push("choices");
  }
  else if (!(data.choices === undefined))
  {
      for (var index in data.choices)
      {
          var choice = data.choices[index];
          if (!(typeof choice.text === "string") || !(typeof choice.correct === "boolean"))
          {
              badData.push("choices");
              break;
          }
      }
  }

  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }
  else {
    var newQuestion = new Question({
      text: data.text,
      choices_available: data.choices_available,
      optional: data.optional,
      poll_id: req.params.pollid,
    });

    newQuestion.save(function (err, quest) {
      if (err) throw err;
      res.send({id: quest.id});

      if (!(data.choices === undefined))
      {
            data.choices.forEach(function (choice, idx, array) {
            var newChoice = new Choice({
              text: choice.text,
              correct: choice.correct,
              question_id: quest.id
            });
            newChoice.save(function (err, save) {
              if (err) throw err;
            });
          });
      }
    });
  }
});

router.post('/poll/:pollid/question/:questionid/choice', function (req, res) {
  var data = req.body;
  var badData = new Array();

  if (!(typeof data.text === "string")) {
    badData.push("text");
  }
  if (!(typeof data.correct === "boolean")) {
    badData.push("correct");
  }

  if (badData.length > 0) {
    res.send(errorCode, {errors: badData});
  }
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
})
;
