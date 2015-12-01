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

  $timeout(function() {
    $scope.renderChart = true;
    console.log('rendering chart');
  });

/*  $http.get('/api/polls/563376e632fc6d2c205744a2/instances/565773186039652c19587340/results/questions/564cc9b615f11a8c1e979702')
    .then(function(response) {
      $scope.nb_answers = response.data.nb_answers;
      $scope.question_text = response.data.text;
      response.data.results.forEach(function(choice, idx, arr) {
        $scope.labels.push(choice.text);
        $scope.data[0].push(choice.nb_chosen);
      });
    }, function(err) {

    });*/

});

// Stat controller
northPoll.controller("statController", function($http, $scope)
{
    $http.get("/api/polls").then(function(response) {
        $scope.total = response.data.nb_open + response.data.nb_closed;
        $scope.recent = response.data.nb_recent;
        $scope.open = response.data.nb_open;
    });
});

// Ui-router
northPoll.config(function ($stateProvider) {
  $stateProvider.state('polls', {
    templateUrl: 'views/partials/poll.jade',
    url: '/polls'
  });
});

// ajouter un service
northPoll.factory('pollManager', function($http) {
    return {
        getPolls: function() {
            // retourner un tableau
            return [
                {
                  name : "poll1",
                  description: "a poll for demo"
                 },
                {
                  name : "poll2",
                  description: "a poll for demo 2"
                 },
                {
                  name : "poll3",
                  description: "a poll for demo 3"
                 },

            ];
        }
     };
 });

 northPoll.controller("pollsController", function(pollManager, $scope) {
    $scope.polls = pollManager.getPolls();
 });

northPoll.controller("PollCreationController", function($scope, $http)
{

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
  
  $scope.currentQuestion = 0;
  $scope.results = [];
  
  $scope.select = function(choice)
  {
      if (choice.selected ||  $scope.remainingChoices > 0)
      {
          $scope.remainingChoices += (choice.selected ? 1 : -1)
          choice.selected = !choice.selected;
      }
      
      $scope.disabled = !$scope.optional && $scope.remainingChoices == $scope.question.choices_available;
  }
  
  $scope.next = function()
  {
      if ($scope.currentQuestion > 0)
      {
          
      }
      
      // Chargement des données de la question
      $scope.question = $scope.questions[$scope.currentQuestion];
      $scope.optional = $scope.questions[$scope.currentQuestion].optional;
      $scope.currentQuestion++;
      
      // Mise à jour des variables de contrôle
      $scope.remainingChoices = $scope.question.choices_available;
      $scope.nextOrSubmit = ($scope.currentQuestion < $scope.questions.length ? "Next" : "Submit");
      $scope.disabled = !$scope.optional && $scope.remainingChoices == $scope.question.choices_available;
  }
  
  $scope.next();
});
