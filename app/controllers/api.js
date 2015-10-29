var express = require('express');
router = express.Router();

module.exports = function (app)
{
  app.use('/api', router);
};

router.get('/test/coucou', function (req, res)
{
  res.format(
  {
    'text/html': function()
    {
      res.send("Coucou");
    }
  });
});

router.get('/test/*', function (req, res)
{
  res.format(
  {
    'text/html': function()
    {
      res.send("Test n°" + req.params[0]);
    }
  });
});

router.get('/*', function (req, res)
{
  res.format(
  {
    'application/json': function()
    {
      res.send({name: "hello", prop : 5});
    },
    'text/html': function()
    {
      res.send("Hello, it works");
    }
  });
});
