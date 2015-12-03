var northPoll = angular.module('northPoll', [
  'ui.router',
  'chart.js'
  //'btford.socket-io'
]);

// Angular chart JS
northPoll.controller("BarCtrl", function ($scope, $http, $timeout) {

  $scope.nb_answers;
  $scope.question_text;
  $scope.labels = [];
  $scope.data = [[]];

  $timeout(function () {
    $scope.renderChart = true;
    console.log('rendering chart');
  });

/*  $http.get('/api/polls/563376e632fc6d2c205744a2/instances/565773186039652c19587340/results/questions/564cc9b615f11a8c1e979702')
    .then(function(response) {
>>>>>>> 36d4b5afaa813a29fdc71e218ec4dcee8f16edde
      $scope.nb_answers = response.data.nb_answers;
      $scope.question_text = response.data.text;
      response.data.results.forEach(function (choice, idx, arr) {
        $scope.labels.push(choice.text);
        $scope.data[0].push(choice.nb_chosen);
      });
    }, function (err) {

    });*/

});

// Stat controller
northPoll.controller("statController", function ($http, $scope) {
  $http.get("/api/polls/stats").then(function (response) {
    $scope.total = response.data.nb_total;
    $scope.recent = response.data.nb_recent;
    $scope.open = response.data.nb_open;
  });
});

// Ui-router
northPoll.config(function ($stateProvider) {
  $stateProvider.state('polls', {
    templateUrl: 'views/partials/statsPoll.jade',
    url: '/polls'
  });
});

northPoll.controller("pollsController", function ($scope, $http) {
  $scope.polls = [];
  $http.get("/api/polls/open").then(function (response) {
    $scope.polls = $scope.polls.concat(response.data.polls);
  });
  $http.get("/api/polls/draft").then(function (response) {
    $scope.polls = $scope.polls.concat(response.data.polls);
  });
  $http.get("/api/polls/closed").then(function (response) {
    $scope.polls = $scope.polls.concat(response.data.polls);
  });
});

northPoll.controller("PollController", function ($scope, $http) {

});

northPoll.controller("AnswerCtrl", function ($scope, $http)
{
  $scope.select = function(choice)
  {
      if (choice.selected ||  $scope.question.remainingChoices > 0)
      {
          $scope.question.remainingChoices += (choice.selected ? 1 : -1)
          choice.selected = !choice.selected;
      }

      $scope.nextDisabled = !$scope.optional && $scope.question.remainingChoices == $scope.question.choices_available;
  }

  $scope.load = function()
  {
      // Chargement des données de la question
      $scope.question = $scope.questions[$scope.currentQuestion];
      $scope.optional = $scope.question.optional;

      // Mise à jour des variables de contrôle
      if ($scope.question.remainingChoices == undefined) {$scope.question.remainingChoices = $scope.question.choices_available;}
      $scope.nextOrSubmit = ($scope.currentQuestion < $scope.questions.length - 1 ? "Suivant" : "Envoyer");
      $scope.nextDisabled = !$scope.optional && $scope.question.remainingChoices == $scope.question.choices_available;
      $scope.prevDisabled = $scope.currentQuestion == 0;
  }

  $scope.previous = function()
  {
      $scope.currentQuestion--;
      $scope.load();
  }

  $scope.next = function()
  {

      if ($scope.currentQuestion < $scope.questions.length - 1)
      {
          $scope.currentQuestion++;
          $scope.load();
      }
      else
      {
          $scope.results = [];
          // Compilation des résultats
          for (var i in $scope.questions)
          {
              var question = $scope.questions[i];
              var result = {};
              result.question = question.text;
              result.choices = [];
              for (var j in question.choices)
              {
                  var choice = $scope.question.choices[j];
                  if (choice.selected != undefined && choice.selected)
                  {
                      result.choices.push(choice.text);
                  }
              }
              $scope.results.push(result);
          }

          console.log($scope.results);
          $http({
                    url: "/api/polls/" + $scope.pollid + "/instances/" + $scope.instanceid + "/results",
                    method: "POST",
                    data : {results : $scope.results}
                }).success(function(data, status, headers, config)
                {
                    console.log($scope.results);
                    alert("Envoyé");
                }).error(function(data, status, headers, config)
                {
                    alert("Erreur lors de l'envoi");
                });
      }
  }

  $scope.pollid = "56604ec7ae06a2207f5914d6";
  $scope.instanceid = "56605176bce6d34805f86426";
  
  $http({
        url: "/api/polls/" + $scope.pollid + "/questions",
        method: "GET"
    }).success(function(data, status, headers, config)
    {
        $scope.questions = data.questions;
        $scope.currentQuestion = -1;
        $scope.results = [];
        $scope.next();
    });
});
