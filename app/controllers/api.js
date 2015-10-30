var express = require('express');
router = express.Router();

module.exports = function (app)
{
  app.use('/api', router);
};

// GET

router.get('/poll/:pollid/question/:questionid/results', function (req, res)
{
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

router.get('/poll/:pollid/question/:questionid', function (req, res)
{
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

router.get('/polls/:type', function (req, res)
{
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

router.get('/poll/:pollid', function (req, res)
{
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

router.get('/poll', function (req, res)
{
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

// POST

router.post('/poll', function (req, res)
{
    var data = req.body;
    res.send("Envoyer du json ici!!! " + data.name);
});
