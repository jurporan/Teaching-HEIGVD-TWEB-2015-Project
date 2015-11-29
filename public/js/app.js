var northPoll = angular.module('northPoll', [
  'ui.router',
  'chart.js'
  //'btford.socket-io'
]);

// Angular chart JS
northPoll.controller("BarCtrl", function ($scope, $http) {

  $scope.nb_answers;
  $scope.question_text;
  $scope.labels = [];
  $scope.data = [[]];

  $http.get('/api/polls/563376e632fc6d2c205744a2/instances/565773186039652c19587340/results/questions/564cc9b615f11a8c1e979702')
    .then(function(response) {
      $scope.nb_answers = response.data.nb_answers;
      $scope.question_text = response.data.text;
      response.data.results.forEach(function(choice, idx, arr) {
        $scope.labels.push(choice.text);
        $scope.data[0].push(choice.nb_chosen);
      });
    }, function(err) {

    });

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

northPoll.controller("AnswerCtrl", function ($scope, $http) {

  $scope.question = "Quelle heure est-il?";
  $scope.choices = [];
  
  $scope.nbQuestions = 4;
  $scope.currentQuestion = 2;
  $scope.availableChoices = 2;
  $scope.choices.push({text : "12:00", selected : false});
  $scope.choices.push({text : "13:00", selected : false});
  $scope.choices.push({text : "14:00", selected : false});
  
  $scope.select = function(choice)
  {

      if (choice.selected || (!choice.selected && $scope.availableChoices > 0))
      {
          $scope.availableChoices += (choice.selected ? 1 : -1)
          choice.selected = !choice.selected;
      }
  }
});
