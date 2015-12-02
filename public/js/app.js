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
    $scope.total = response.data.nb_open + response.data.nb_closed;
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

northPoll.controller("PollCreationController", function ($scope, $http) {

});

northPoll.controller("AnswerCtrl", function ($scope, $http)
{

  // Chargé dans une requête ajax, ici manuel pour les tests
  $scope.questions = [];
  var q1 =
  {
      text : "Quelle heure est-il?",
      choices_available : 2,
      optional : false,
      choices : [{id : 1, text : "12:00"}, {id : 2, text : "13:00"}, {id : 3, text : "14:00"}]
  }
  var q2 =
  {
      text : "Quelle temps fait-il?",
      choices_available : 1,
      optional : true,
      choices : [{id : 1, text : "Beau"}, {id : 2, text : "Moche"}]
  }
  var q3 =
  {
      text : "1 + 3 = ...",
      choices_available : 2,
      optional : false,
      choices : [{id : 1, text : "1"}, {id : 2, text : "3.14"}, {id : 3, text : "7"}, {id : 4, text : "yolo"}]
  }
  $scope.questions.push(q1);
  $scope.questions.push(q2);
  $scope.questions.push(q3);
  //-----------------------------------------------

  $scope.currentQuestion = -1;
  $scope.results = [];

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

          alert("Terminé");
          console.log($scope.results);
      }
  }

  $scope.next();
});
