var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api', router);
};

// GET

router.get('/poll/:pollid/question/:questionid/results', function (req, res) {
  res.format(
    {
      'application/json': function () {
        res.send({});
      }
    });
});

router.get('/poll/:pollid/question/:questionid', function (req, res) {
  res.format(
    {
      'application/json': function () {
        res.send("Envoyer du json ici!!!");
      }
    });
});

router.get('/polls/:type', function (req, res) {
  res.format(
    {
      'application/json': function () {
        res.send("Envoyer du json ici!!!");
      }
    });
});

router.get('/poll/:pollid', function (req, res) {
  res.format(
    {
      'application/json': function () {
        res.send("Envoyer du json ici!!!");
      }
    });
});

router.get('/poll', function (req, res) {

  var response = {};
  Poll.count({
      $or: [
        {state: "active"},
        {state: "drafti"}
      ]
    },
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
  res.send("Envoyer du json ici!!! " + data.name);
});
