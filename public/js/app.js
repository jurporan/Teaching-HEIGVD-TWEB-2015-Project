var northPoll = angular.module('northPoll', []);

northPoll.controller("statController", function($http, $scope)
{
    $http.get("/api/poll").then(function(response)
    {
        $scope.total = response.data.nb_open + response.data.nb_closed;
        $scope.recent = response.data.nb_recent;
        $scope.open = response.data.nb_open;
    }).then(function(response)
    {
        alert("Error! " + response.statusText);
    });
});
