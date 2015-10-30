var express = require('express');
router = express.Router();

module.exports = function (app)
{
  app.use('/api', router);
};

router.get('/poll/*/question/*/results', function (req, res)
{
    // Les paramètres sont récupérables via req.params[x]
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

router.get('/poll/*/question/*', function (req, res)
{
    // Les paramètres sont récupérables via req.params[x]
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

router.get('/polls/*', function (req, res)
{
    // Les paramètres sont récupérables via req.params[x]
    // * peut être égal à draft/open/close
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});

router.get('/poll/*', function (req, res)
{
    // Les paramètres sont récupérables via req.params[x]
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
    // Les paramètres sont récupérables via req.params[x]
  res.format(
  {
    'application/json': function()
    {
      res.send("Envoyer du json ici!!!");
    }
  });
});
