var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Poll = mongoose.model('Poll');




module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  Poll.count(function(err, totPolls) {
    if(err) throw next(err);

    var actualDate = new Date(Date.now());
    Poll.count({ creationDate: {$gt: new Date().setDate(actualDate.getDate() - 7)} },
    function(err, totWeekPolls) {
      if(err) throw err;

      Poll.count({ $or: [
          {state: "active"},
          {state: "drafti"}
        ]},
      function(err, totOpenPolls) {
          if(err) throw next(err);
          res.render('index', {
            title: 'PollY',
            pollsTot: totPolls,
            pollsTotWeek: totWeekPolls,
            pollsTotOpen: totOpenPolls
          });
      });
    });
  });
});
