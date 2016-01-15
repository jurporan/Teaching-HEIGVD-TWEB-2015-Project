var northPoll = angular.module('northPoll', [
  'ui.router',
  'chart.js',
  'btford.socket-io',
  'ui.bootstrap'
]);

// Ui-router
northPoll.config(function ($stateProvider) {
  $stateProvider.state('listPolls', {
    templateUrl: 'views/partials/polls.jade',
    url: '/'
  });
  $stateProvider.state('answerInstancePoll', {
    templateUrl: 'views/partials/answer.jade',
    url: '/answer/:pollId/instance/:instId'
  });
  $stateProvider.state('statsInstancePoll', {
    templateUrl: 'views/partials/statsPoll.jade',
    url: '/stats/:pollId/instance/:instId'
  });
  $stateProvider.state('createPoll', {
    templateUrl: 'views/partials/create_poll.jade',
    url: '/createPoll'
  });
  $stateProvider.state('editPoll', {
    templateUrl: 'views/partials/create_poll.jade',
    url: '/editPoll/:pollId'
  })
});

// This factory is necessary to use socket.io in our controllers
northPoll.factory('mySocket', function (socketFactory) {
  return socketFactory();
});


northPoll.controller("carouselController", function ($scope, $state) {
  $scope.currentState = $state.current;
});

// Stats of the app controller
northPoll.controller("statsAppController", function ($http, $scope) {
  $http.get("/api/polls/stats").then(function (response) {
    $scope.total = response.data.nb_total;
    $scope.recent = response.data.nb_recent;
    $scope.open = response.data.nb_open;
  });
});


// Stats of an instance controller
northPoll.controller("statsInstanceController", function ($scope, $http, mySocket, $stateParams) {

  // Fetch names of actual instance and poll
  $scope.instanceId = $stateParams.instId;
  $scope.pollId = $stateParams.pollId;

  $http.get("/api/polls/" + $scope.pollId).then(function (response) {
    $scope.pollName = response.data.name;
    if (response.data.public_results === false) {
      $scope.pollName = "Stats are private";
      return;
    }

    $http.get("/api/polls/" + $scope.pollId + "/instances/" + $scope.instanceId).then(function (response) {
      $scope.instanceName = response.data.name;
      $scope.everthingsVerified();
    }, function (response) {
      $scope.pollName = response.data;
    });

  }, function (response) {
    $scope.pollName = response.data;
  });

  // Continue if everthings is verified
  $scope.everthingsVerified = function () {

    $scope.questions = [];

    // http request to get all questions in the selected poll
    $http.get("/api/polls/" + $scope.pollId + "/questions").then(function (response) {

      // Iterate on questions
      response.data.questions.forEach(function (question, idxQuest, arrResp) {

        var nbChoices = 0; // Total number of choices

        // Creation of an object
        $scope.questions.push({
          nb_answers: null,
          question_text: question.text,
          labels: [],
          data: [],
          percentage: []
        });

        $scope.calculatePercentageForQuestion = function (question, idQuest) {
          question.percentage.forEach(function (percentageChoice, idx, arr) {
            question.percentage[idx] = question.data[idx] / question.nb_answers * 100;
            if (idx === arr.length - 1) {
              $scope.questions[idQuest] = question;
            }
          });
        }

        // http request to get results of the actual question in the actual instance
        $http.get(
          "/api/polls/" + $scope.pollId +
          "/instances/" + $scope.instanceId +
          "/results/questions/" + question.id
        )
          .then(function (response) {

            // Complete number of answers in the object of the array questions
            $scope.questions[idxQuest].nb_answers = response.data.nb_answers;

            // Iterate on every choice in the question of the actual instance
            response.data.results.forEach(function (choice, idx, arr) {

              // Complete choice's field in the object of the array questions
              $scope.questions[idxQuest].labels.push(choice.text);
              $scope.questions[idxQuest].data.push(choice.nb_chosen);

              nbChoices += choice.nb_chosen; // Increment total number of choices

              // Push the partial percentage, we'll divide later when we'll have the total number of choices
              $scope.questions[idxQuest].percentage.push(-1);

              // Ensure that this is the latest iteration
              if (idxQuest === arrResp.length - 1 && idx === arr.length - 1) {
                $scope.questions.forEach(function (question, idx, arr) {
                  $scope.calculatePercentageForQuestion(question, idx);
                });
              }
            });
          });
      });
    });

    mySocket.forward('updateChart', $scope);

    $scope.$on('socket:updateChart', function (ev, data) {
      if (data[0].question === $scope.questions[0].question_text) {
        console.log("C'est pareil je mets a jour");
        $scope.questions.forEach(function (question, idxQuest, arr) {
          question.nb_answers = question.nb_answers + data[idxQuest].choices.length;

          data[idxQuest].choices.forEach(function (choice, idx, arr) {
            question.labels.some(function (label, idxScp, arrScp) {
              if (label === choice) {
                question.data[idxScp]++;
                return true;
              }
            });
            if (idx === arr.length - 1) {
              $scope.calculatePercentageForQuestion(question, idxQuest);
              /*question.percentage.forEach(function (percentageChoice, idx, arr) {
               question.percentage[idx] = question.data[idx] / question.nb_answers * 100;
               });*/
            }
          });
        });
      }
    });
  }
});

// List of polls controller
northPoll.controller("pollsController", function ($scope, $http, $stateParams, $uibModal) {

  $scope.showModal = false;

  $scope.polls = [];

  // Firstly we get all open polls
  $http.get("/api/polls/open").then(function (response) {
    $scope.polls = $scope.polls.concat(response.data.polls); // Add to polls array

    // Then we get all draft polls
    $http.get("/api/polls/draft").then(function (response) {
      $scope.polls = $scope.polls.concat(response.data.polls);

      // Finally we get all closed polls
      $http.get("/api/polls/closed").then(function (response) {
        $scope.polls = $scope.polls.concat(response.data.polls);

        // Iterate on each poll
        $scope.polls.forEach(function (poll, idx, arr) {
          if (poll.state != 'draft') { // There is no instances for draft poll

            // Get instances for the actual poll
            $http.get('/api/polls/' + poll.id + '/instances').then(function (resp) {
              poll.instances = resp.data.instances;
            });
          }
        });
      });
    });
  });

  $scope.openModal = function (pass, pollId, instId, action) {
    var modalInstance = $uibModal.open({
      size: 'sm',
      templateUrl: 'views/partials/modalPassword.jade',
      controller: 'ModalInstanceCtrl',
      resolve: {
        passRequired: function () {
          return pass;
        },
        pollId: function () {
          return pollId;
        },
        instId: function () {
          return instId;
        },
        action: function () {
          return action;
        }
      }
    });
  };

});

northPoll.controller("ModalInstanceCtrl", function ($scope, $uibModalInstance, passRequired, pollId,
                                                    instId, $uibModal, $state, action) {
  $scope.ok = function () {
    if ($scope.pass === passRequired) {
      $uibModalInstance.close('ok');
      $state.go(action, {instId: instId, pollId: pollId});
    } else {
      // Password failed
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partials/modalErrorPassword.jade',
        controller: 'ErrorPasswordCtrl',
        backdrop: true,
        keyboard: true,
        backdropClick: true,
        size: 'lg'
      });
    }
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});

northPoll.controller("ErrorPasswordCtrl", function ($scope, $uibModalInstance) {
  $scope.close = function () {
    $uibModalInstance.close();
  };
});

/* This angular controller is used in the creation and modificaation process of
 a poll. For now only the creation process is done. The update process will have
 to wait for the next step.*/
northPoll.controller("PollController", function ($scope, $http, $state, $stateParams) {

  $scope.actionString = "Créer le sondage";
  $scope.create = $state.current.name === "createPoll";
  $scope.edit = $state.current.name === "editPoll";

  $scope.formVisible = true;
  $scope.questionVisible = false;
  $scope.questionAvailable = false;
  $scope.deletePossible = false;
  $scope.instancesVisible = false;
  $scope.isPublic = false;
  $scope.questionAdded = false;

  if ($scope.edit) {
      $scope.actionString = "Modifier le sondage";
      $scope.questionVisible = false;
      $scope.questionAvailable = true;
      $scope.deletePossible = true;
      $scope.instancesVisible = true;
    $http.get("/api/polls/" + $stateParams.pollId).then(function (response) {
      $scope.pollName = response.data.name;
      $scope.adminName = response.data.creator;
      $scope.adminPassword = response.data.admin_password;
      $scope.adminPasswordConfirmation = response.data.admin_password;
      $scope.userPassword = response.data.user_password;
      $scope.userPasswordConfirmation = response.data.user_password;
      $scope.isPublic = response.data.public_results;
    });
  }

  /* Variables use to indicate if the fields in the form are valid or not. By defautl they are. When the user tries to post the form we will check the validity and change those variable accordingly. Those verifications are not
   done yet.*/
  $scope.pollNameValid = true;
  $scope.adminNameValid = true;
  $scope.adminPasswordValid = true;
  $scope.adminPasswordConfirmationValid = true;
  $scope.userPasswordValid = true;
  $scope.userPasswordConfirmationValid = true;

  /* The current pollID. When creating a new poll this is undefined and will be
   set when the poll is posted.*/
  $scope.pollId = "none";

  $scope.createPoll = function () {

      if($scope.pollName == null || $scope.pollName.length < 1)
      { $scope.pollNameValid = false;}
      else
      { $scope.pollNameValid = true; }

      if($scope.adminName == null || $scope.adminName.length < 1)
      { $scope.adminNameValid = false}
      else
      { $scope.adminNameValid = true; }

      if($scope.adminPassword == null || $scope.adminPassword.length < 1)
      { $scope.adminPasswordValid = false}
      else
      { $scope.adminPasswordValid = true; }

      if(!($scope.adminPassword === $scope.adminPasswordConfirmation))
      { $scope.adminPasswordConfirmationValid = false}
      else
      { $scope.adminPasswordConfirmationValid = true; }

      if(!($scope.userPassword === $scope.userPasswordConfirmation))
      { $scope.userPasswordConfirmationValid = false}
      else
      { $scope.userPasswordConfirmationValid = true; }

      if(!$scope.pollNameValid || !$scope.adminNameValid || !$scope.adminPasswordValid || !$scope.adminPasswordConfirmationValid || !$scope.userPasswordConfirmationValid)
      {
          alert("Certains champs du formulaire contiennent des erreurs");
          return;
      }

      $http({
        url: "/api/polls/",
        method: "POST",
        data: {
          name: $scope.pollName,
          creator: $scope.adminName,
          admin_password: $scope.adminPassword,
          user_password: $scope.userPassword,
          public_results: $scope.isPublic
        }
      }).success(function (data, status, headers, config) {
        // We retrieve the pollId.
        $scope.pollId = data.id;
        // New actions are now available.
        $scope.edit= true;
        $scope.create = false;
        $scope.questionAvailable = true;
        $state.go("editPoll", {pollId: $scope.pollId});

      }).error(function (data, status, headers, config) {
        alert("Erreur lors de l'envoi");
      });
  }

  $scope.updatePoll = function (){
      $http({
        url: "/api/polls/",
        method: "POST",
        data: {
          name: $scope.pollName,
          creator: $scope.adminName,
          admin_password: $scope.adminPassword,
          user_password: $scope.userPassword,
          public_results: $scope.isPublic
        }
      }).success(function (data, status, headers, config) {
        // We retrieve the pollId.
        $scope.pollId = data.id;
        // New actions are now available.
        $scope.edit= true;
        $scope.create = false;
        $scope.questionAvailable = true;
      }).error(function (data, status, headers, config) {
        alert("Erreur lors de l'envoi");
      });
  }

  /* We remove the poll. */
  $scope.deletePoll = function () {
      $http({
          url : "/api/polls/" + $scope.pollId,
          method: "DELETE",
          data: {}
      }).success(function (data, status, headers, config) {
          alert("Le sondage a été supprimé.");
      }).error(function (data, status, headers, config) {
          alert("Le sondage n'a pas put être supprimé.")
      });
  }

  /* When the user wishes to add questions to the poll, we change the view to
   display the question creation form. */
  $scope.createQuestion = function () {
    $scope.formVisible = false;
    $scope.questionVisible = true;
    $scope.instancesVisible = false;
  }

  /* Changes the UI when the user wished to return to the main form. */
  $scope.modifyPoll = function () {
    $scope.formVisible = true;
    $scope.questionVisible = false;
  }

  /* Array used to add choices to the form. When a choice is added a new
   field will be added to the UI.*/
  $scope.choices = [];
  /* Initialization of the creation form checkbox. If they are not it could
   cause errors if they are not checked by the user. */
  $scope.isCorrect = false;
  $scope.isOptional = false;

  // Add the choice in the lower part of the UI to the array and renitialize the fields.
  $scope.addChoice = function () {
    $scope.choices.push({text: $scope.choiceText, correct: $scope.isCorrect});
    $scope.choiceText = "";
    $scope.isCorrect = false;
    $scope.maxChoices = 1;
  }

  /* Add the question to the poll. If an error is encountered an alert is displayed.
   Upon success the fields are renitialized and an alret is also displayed. */
  $scope.addQuestion = function () {
    $scope.choices.push({text: $scope.choiceText, correct: $scope.isCorrect});
    $http({
      url: "/api/polls/" + $scope.pollId + "/questions",
      method: "POST",
      data: {
        text: $scope.questionText,
        choices_available: $scope.maxChoices,
        optional: $scope.isOptional,
        choices: $scope.choices
      }
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

  // Adds an instance to the poll.
  $scope.addInstance = function () {
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

// This angular controller will handle the response process. It is responsible of everything related to the answer fragment of the page.
northPoll.controller("AnswerCtrl", function ($scope, $http, mySocket, $stateParams) {

  // This function handles the click on a choice
  $scope.select = function (choice) {

    // If the choice can be selected or is currently selected
    if (choice.selected || $scope.question.remainingChoices > 0) {

      // We toggle the choice on or off
      $scope.question.remainingChoices += (choice.selected ? 1 : -1)
      choice.selected = !choice.selected;
    }

    // Will enable or disable the "Next" button
    $scope.nextDisabled = !$scope.optional && $scope.question.remainingChoices == $scope.question.choices_available;
  }

  // This function will refresh the answer view (question, choice, etc) each time the user changes question
  $scope.load = function () {
    // Loading the question and its parameters
    $scope.question = $scope.questions[$scope.currentQuestion];
    $scope.optional = $scope.question.optional;

    // We update the control variables that enable/disable interface controls
    if ($scope.question.remainingChoices == undefined) {
      $scope.question.remainingChoices = $scope.question.choices_available;
    }
    $scope.nextOrSubmit = ($scope.currentQuestion < $scope.questions.length - 1 ? "Suivant" : "Envoyer");
    $scope.nextDisabled = !$scope.optional && $scope.question.remainingChoices == $scope.question.choices_available;
    $scope.prevDisabled = $scope.currentQuestion == 0;
  }

  // This function is called when the user clicks on "Previous" button, we simply decrement the counter and refresh the view
  $scope.previous = function () {
    $scope.currentQuestion--;
    $scope.load();
  }

  // This function is called when the user clicks on "Next" button
  $scope.next = function () {

    // If there are more quesrtions to answer, we simply increment the counter and load the next one
    if ($scope.currentQuestion < $scope.questions.length - 1) {
      $scope.currentQuestion++;
      $scope.load();
    }

    // Otherwise, we have to send the data to the server
    else {
      // Result array
      $scope.results = [];

      // We can now walk through the questions and pack the answers on the array
      for (var i in $scope.questions) {
        var question = $scope.questions[i];
        var result = {};
        result.question = question.text;
        result.choices = [];

        // We store each selected choice
        for (var j in question.choices) {
          var choice = question.choices[j];
          if (choice.selected != undefined && choice.selected) {
            result.choices.push(choice.text);
          }
        }
        $scope.results.push(result);
      }

      mySocket.emit('updateChart', $scope.results);

      // We can now send the HTTP request to submit the answers
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

  // initialization, we need to get all the question of the selected choice, so we proceed an HTTP request to get them
  $scope.pollid = $stateParams.pollId;
  $scope.instanceid = $stateParams.instId;

  $http({
    url: "/api/polls/" + $scope.pollid + "/questions",
    method: "GET"
  }).success(function (data, status, headers, config) {

    // On success, we store the data and the answer process can begin
    $scope.questions = data.questions;
    $scope.currentQuestion = -1;
    $scope.results = [];
    $scope.next();
  });
});
