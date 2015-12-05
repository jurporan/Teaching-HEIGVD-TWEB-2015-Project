var northPoll = angular.module('northPoll', [
  'ui.router',
  'chart.js',
  'btford.socket-io'
]);

// Ui-router
northPoll.config(function ($stateProvider) {
  $stateProvider.state('listPolls', {
    templateUrl: 'views/partials/polls.jade',
    url: ''
  });
  $stateProvider.state('answerInstancePoll', {
    templateUrl: 'views/partials/answer.jade',
    url: ''
  });
  $stateProvider.state('statsInstancePoll', {
    templateUrl: 'views/partials/statsPoll.jade',
    url: ''
  });
  $stateProvider.state('createPoll', {
    templateUrl: 'views/partials/create_poll.jade',
    url: 'createPoll'
  })
});

northPoll.factory('ActualInstanceOfPoll', function () {
  return {instance: '', poll: ''};
});

northPoll.factory('mySocket', function (socketFactory) {
  return socketFactory();
});

// Stat controller
northPoll.controller("statsAppController", function ($http, $scope) {
  $http.get("/api/polls/stats").then(function (response) {
    $scope.total = response.data.nb_total;
    $scope.recent = response.data.nb_recent;
    $scope.open = response.data.nb_open;
  });
});

// Angular chart JS
northPoll.controller("statsInstanceController", function ($scope, $http, ActualInstanceOfPoll, mySocket) {

  $scope.instanceName = ActualInstanceOfPoll.instance.name;
  $scope.pollName = ActualInstanceOfPoll.poll.name;

  $scope.questions = [];

  mySocket.forward('updateVotes', $scope);

  $scope.$on('socket:updateVotes', function(ev, data) {
    $scope.questions = data;
  });

  mySocket.emit('salut');

  $http.get("/api/polls/" + ActualInstanceOfPoll.poll.id + "/questions").then(function (response) {
    response.data.questions.forEach(function (question, idx, arrResp) {
      var nbChoices = 0;
      var idxQuest = idx;
      $scope.questions.push({
        nb_answers:null,
        question_text:question.text,
        labels:[],
        data:[],
        percentage:[]
      });

      $http.get(
        "/api/polls/" + ActualInstanceOfPoll.poll.id +
        "/instances/" + ActualInstanceOfPoll.instance.id +
        "/results/questions/" + question.id
      )
        .then(function (response) {
          $scope.questions[idxQuest].nb_answers = response.data.nb_answers;

          response.data.results.forEach(function (choice, idx, arr) {
            $scope.questions[idxQuest].labels.push(choice.text);
            $scope.questions[idxQuest].data.push(choice.nb_chosen);
            nbChoices += choice.nb_chosen;
            $scope.questions[idxQuest].percentage.push(choice.nb_chosen * 100);
            if(idxQuest === arrResp.length - 1 && idx === arr.length - 1) {
              $scope.questions.forEach(function(question, idx, arr) {
                question.percentage.forEach(function(percentageChoice, idx, arr) {
                  question.percentage[idx] = percentageChoice / nbChoices;
                  console.log($scope.questions);
                });
              });
            }
          });
        });
    });
  });


});

northPoll.controller("pollsController", function ($scope, $http, ActualInstanceOfPoll) {

  $scope.setActualInstanceOfPoll = function (inst, poll) {
    ActualInstanceOfPoll.instance = inst;
    ActualInstanceOfPoll.poll = poll;
  }

  $scope.participateInInstance = function (instance, poll) {
    $scope.setActualInstanceOfPoll(instance, poll);
  }

  $scope.statsOfAnInstance = function (instance, poll) {
    $scope.setActualInstanceOfPoll(instance, poll);
  }

  $scope.polls = [];
  $http.get("/api/polls/open").then(function (response) {
    $scope.polls = $scope.polls.concat(response.data.polls);

    $http.get("/api/polls/draft").then(function (response) {
      var nb_draft = response.data.polls.length;
      $scope.polls = $scope.polls.concat(response.data.polls);

      $http.get("/api/polls/closed").then(function (response) {
        $scope.polls = $scope.polls.concat(response.data.polls);
      });

      var inserted = 0;
      $scope.polls.forEach(function (poll, idx, arr) {
        poll.instances = [];
        if (poll.state != 'draft') {
          $http.get('/api/polls/' + poll.id + '/instances').then(function (resp) {
            poll.instances = resp.data.instances;
            inserted++;
            if (inserted == arr.length - nb_draft) {
              //console.log($scope.polls);
            }
          });
        }
      });
    });
  });

});

northPoll.controller("PollController", function ($scope, $http) {

    $scope.pollActionString = "Créer le sondage";
    $scope.pollActionDisabled = false;
    $scope.formVisible = true;
    $scope.questionVisible = false;
    $scope.questionAvailable = false;
    $scope.deletePossible = false;
    $scope.instancesVisible = false;
    $scope.isPublic = false;
    $scope.questionAdded = false;

    /* Variables to indicate if the fields in the form are valid or not. By defautl they are. When the user tries to post the form we will check the validity and change those variable accordingly. */
    $scope.pollNameValid = true;
    $scope.adminNameValid = true;
    $scope.adminPasswordValid = true;
    $scope.adminPasswordConfirmationValid = true;
    $scope.userPasswordValid = true;
    $scope.userPasswordConfirmationValid = true;

    $scope.pollId = "none";

    /* If the user is creating is creating a poll, we post the new poll informations, in the other case we update the poll */
    $scope.pollAction = function() {

        if ($scope.pollActionString == "Créer le sondage"){
            $http({
                url: "/api/polls/",
                method: "POST",
                data: {name: $scope.pollName, creator : $scope.adminName, admin_password : $scope.adminPassword, user_password : $scope.userPassword, public_results : $scope.isPublic}
            }).success(function (data, status, headers, config) {
                // We retrieve the pollId.
                $scope.pollId = data.id;
                // New actions are now available.
                $scope.pollActionString = "Appliquer les modifications";
                $scope.pollActionDisabled = true;
                //$scope.deletePossible = true;
                $scope.questionAvailable = true;
            }).error(function (data, status, headers, config) {
                alert("Erreur lors de l'envoi");
            });
        }

        else
        {
            // TODO : Update form
        }
    }

    $scope.createQuestion = function(){
        $scope.formVisible = false;
        $scope.questionVisible = true;
        $scope.instancesVisible = false;
    }

    $scope.modifyPoll = function(){
        $scope.formVisible = true;
        $scope.questionVisible = false;
        //if($scope.questionAdded){$scope.instancesVisible = true;}
    }

    $scope.choices = [];
    $scope.isCorrect = false;
    $scope.isOptional = false;

    $scope.addChoice = function() {
        $scope.choices.push({text : $scope.choiceText, correct : $scope.isCorrect});
        $scope.choiceText = "";
        $scope.isCorrect = false;
        $scope.maxChoices = 1;
    }

    $scope.addQuestion = function(){
        $scope.choices.push({text : $scope.choiceText, correct : $scope.isCorrect});
        $http({
            url: "/api/polls/" + $scope.pollId + "/questions",
            method: "POST",
            data: {text: $scope.questionText, choices_available : $scope.maxChoices, optional : $scope.isOptional, choices : $scope.choices}
        }).success(function (data, status, headers, config) {
            $scope.choices = [];
            $scope.choiceText = "";
            $scope.isCorrect = false;
            $scope.isOptional = false;
            $scope.maxChoices = 1;
            $scope.questionText = "";
            $scope.questionAdded = true;
            alert("Question ajoutée");
        }).error(function (data, status, headers, config) {
            alert("Erreur lors de l'envoi");
        });
    }

    $scope.addInstance = function(){
        $http({
            url: "/api/polls/" + $scope.pollId + "/instances",
            method: "POST",
            data: {name: $scope.instanceName}
        }).success(function (data, status, headers, config) {
            alert("Nouvelle instance créée");
        }).error(function (data, status, headers, config) {
            alert("Erreur lors de l'envoi");
        });
    }
});

northPoll.controller("AnswerCtrl", function ($scope, $http, ActualInstanceOfPoll, mySocket) {
  $scope.select = function (choice) {
    if (choice.selected || $scope.question.remainingChoices > 0) {
      $scope.question.remainingChoices += (choice.selected ? 1 : -1)
      choice.selected = !choice.selected;
    }

    $scope.nextDisabled = !$scope.optional && $scope.question.remainingChoices == $scope.question.choices_available;
  }

  $scope.load = function () {
    // Chargement des données de la question
    $scope.question = $scope.questions[$scope.currentQuestion];
    $scope.optional = $scope.question.optional;

    // Mise à jour des variables de contrôle
    if ($scope.question.remainingChoices == undefined) {
      $scope.question.remainingChoices = $scope.question.choices_available;
    }
    $scope.nextOrSubmit = ($scope.currentQuestion < $scope.questions.length - 1 ? "Suivant" : "Envoyer");
    $scope.nextDisabled = !$scope.optional && $scope.question.remainingChoices == $scope.question.choices_available;
    $scope.prevDisabled = $scope.currentQuestion == 0;
  }

  $scope.previous = function () {
    $scope.currentQuestion--;
    $scope.load();
  }

  $scope.next = function () {

    if ($scope.currentQuestion < $scope.questions.length - 1) {
      $scope.currentQuestion++;
      $scope.load();
    }
    else {
      $scope.results = [];
      // Compilation des résultats
      for (var i in $scope.questions) {
        var question = $scope.questions[i];
        var result = {};
        result.question = question.text;
        result.choices = [];
        for (var j in question.choices) {
          var choice = question.choices[j];
          if (choice.selected != undefined && choice.selected) {
            result.choices.push(choice.text);
          }
        }
        $scope.results.push(result);
      }

      console.log($scope.results);
      $http({
        url: "/api/polls/" + $scope.pollid + "/instances/" + $scope.instanceid + "/results",
        method: "POST",
        data: {results: $scope.results}
      }).success(function (data, status, headers, config) {
        console.log($scope.results);
        alert("Envoyé");
      }).error(function (data, status, headers, config) {
        alert("Erreur lors de l'envoi");
      });
    }
  }

  $scope.pollid = ActualInstanceOfPoll.poll.id;
  $scope.instanceid = ActualInstanceOfPoll.instance.id;

  $http({
    url: "/api/polls/" + $scope.pollid + "/questions",
    method: "GET"
  }).success(function (data, status, headers, config) {
    $scope.questions = data.questions;
    $scope.currentQuestion = -1;
    $scope.results = [];
    $scope.next();
  });
});
