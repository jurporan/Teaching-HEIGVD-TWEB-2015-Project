var northPoll = angular.module('northPoll', []);


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
        $scope.total = response.data.nb_open + response.data.nb_closed;
        $scope.recent = response.data.nb_recent;
        $scope.open = response.data.nb_open;
    }).then(function(response){
        alert("Error! " + response.statusText);
    });
    
 });
 
 northPoll.controller("pollsController", function(pollManager, $scope) {
    $scope.polls = pollManager.getPolls();

    
 });

