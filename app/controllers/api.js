var express = require('express');
router = express.Router();

var errorCode = 418;

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
    var badData = new Array();

    if (!(typeof data.name === "string")) {badData.push("name");}
    if (!(typeof data.creator === "string")) {badData.push("creator");}
    if (!(typeof data.admin_password === "string")) {badData.push("admin_password");}
    
    if (badData.length > 0) {res.send(errorCode, {errors : badData});}
    else
    {
        // Données correctes
        // Attention, data.user_password peut être défini ou non, à contrôler
        res.send("OK");
    }
});

router.post('/poll/:pollid/question', function (req, res)
{
    var data = req.body;
    var badData = new Array();

    if (!(typeof data.text === "string")) {badData.push("text");}
    if (!(typeof data.choices_available === "number")) {badData.push("choices_available");}
    if (!(typeof data.optional === "boolean")) {badData.push("optional");}
    
    if (badData.length > 0) {res.send(errorCode, {errors : badData});}
    else
    {
        // Données correctes
        // Attention, choices peut déjà contenir des choix à traiter
        res.send("OK");
    }
});
