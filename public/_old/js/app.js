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
    $http.get("/api/polls").then(function(response)
    {
        $scope.total = response.data.nb_open + response.data.nb_total;
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


northPoll.controller("statController", function($http, $scope) {
    $http.get("/api/poll").then(function(response){
        $scope.total = response.data.nb_open + response.data.nb_total;
        $scope.recent = response.data.nb_recent;
        $scope.open = response.data.nb_open;
    }).then(function(response){
        alert("Error! " + response.statusText);
    });

 });

 northPoll.controller("pollsController", function(pollManager, $scope) {
    $scope.polls = pollManager.getPolls();
 });

