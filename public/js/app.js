// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

var northPoll = angular.module('northPoll', [
  'ui.router',
  'chart.js',
  'btford.socket-io',
  'ui.bootstrap'
]);

// Ui-router
northPoll.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

  //$locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise('/');

  $stateProvider.state('welcome', {
    templateUrl: 'views/partials/welcome.jade',
    url: '/'
  });

  $stateProvider.state('listPolls', {
    templateUrl: 'views/partials/polls.jade',
    url: '/polls'
  });
  $stateProvider.state('answerInstancePoll', {
    templateUrl: 'views/partials/answer.jade',
    url: '/answer/:pollId/instance/:instId'
  });
  $stateProvider.state('statsInstancePoll', {
    templateUrl: 'views/partials/statsPoll.jade',
    url: '/stats/:pollId/instance/:instId?pass'
  });
  $stateProvider.state('createPoll', {
    templateUrl: 'views/partials/create_poll.jade',
    url: '/createPoll'
  });
  $stateProvider.state('editPoll', {
    templateUrl: 'views/partials/create_poll.jade',
    url: '/editPoll/:pollId?pass'
  });
  $stateProvider.state('manageQuestions', {
    templateUrl: 'views/partials/manageQuestions.jade',
    url: '/editPoll/:pollId/questions?pass'
  });
  $stateProvider.state('manageInstances', {
    templateUrl: 'views/partials/manageInstances.jade',
    url: '/editPoll/:pollId/instances?pass'
  });
});

// This factory is necessary to use socket.io in our controllers
northPoll.factory('mySocket', function (socketFactory) {
  return socketFactory();
});

var openModal = function (uibModal, title, text, type) {
  var modalInstance = uibModal.open({
    templateUrl: 'views/partials/modalMessage.jade',
    controller: 'modalMessageCtrl',
    backdrop: true,
    keyboard: true,
    backdropClick: true,
    size: 'lg',
    resolve: {
      msg: function () {
        return title;
      },
      txt: function () {
        return text;
      },
      colorClass: function () {
        return type;
      }
    }
  });
};

northPoll.controller("carouselController", function ($scope, $state) {
  $scope.currentState = $state.current;
});

// Stats of the app controller
northPoll.controller("statsAppController", function ($http, $scope, $state) {
  $http.get("/api/polls/stats").then(function (response) {
    $scope.total = response.data.nb_total;
    $scope.recent = response.data.nb_recent;
    $scope.open = response.data.nb_open;
  });

  $scope.goToPolls = function () {
    $state.go('listPolls');
  };
});


// Stats of an instance controller
northPoll.controller("statsInstanceController", function ($scope, $http, mySocket, $stateParams, $uibModal, $state) {

  // Fetch names of actual instance and poll
  $scope.instanceId = $stateParams.instId;
  $scope.pollId = $stateParams.pollId;
  $scope.pass = $stateParams.pass;

  // Define url of the get
  $scope.url = "api/polls/" + $scope.pollId;
  if ($scope.pass !== undefined) {
    $scope.url += "?pass=" + $scope.pass;
  }

  $http.get($scope.url).then(function (response) {
    $scope.pollName = response.data.name;

    // Check if the stats of the poll is private
    if (response.data.public_results === false && response.data.admin_password === undefined) {
      openModal($uibModal, "Erreur!", "Les statistiques de ce sondage sont privées.", "alert-danger");
      $state.go('listPolls');
      return;
    }

    // Check if the instance exist
    $http.get("/api/polls/" + $scope.pollId + "/instances/" + $scope.instanceId).then(function (response) {
      $scope.instanceName = response.data.name;
      $scope.everthingsVerified(); // All is OK, we can continue
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

        // Function to calculate the percentage of choices repartition
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
                  $scope.calculatePercentageForQuestion(question, idx); // Calculate percentage
                });
              }
            });
          });
      });
    });

    mySocket.forward('updateChart', $scope);

    // React on updateChart event
    $scope.$on('socket:updateChart', function (ev, data) {
      // If the event concern our poll
      if (data[0].question === $scope.questions[0].question_text) {

        // Update fields
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

  // Function that open a modal dynamically with ui.bootstrap
  $scope.openModal = function (pollId, instId, action, typePass) {
    var modalInstance = $uibModal.open({
      size: 'sm',
      templateUrl: 'views/partials/modalPassword.jade',
      controller: 'ModalInstanceCtrl',
      resolve: { // Forward parameters
        pollId: function () {
          return pollId;
        },
        instId: function () {
          return instId;
        },
        action: function () {
          return action;
        },
        typePass: function () {
          return typePass;
        }
      }
    });
  };

});

// Controller of the instance of a password modal instance
northPoll.controller("ModalInstanceCtrl", function ($scope, $uibModalInstance, pollId, $http,
                                                    instId, $uibModal, $state, action, typePass) {
  // Validate button click
  $scope.ok = function () {

    // Get the desired poll
    $http.get("/api/polls/" + pollId + "?pass=" + $scope.pass + "&typePass=" + typePass).then(function (response) {

      // If the password is false, the API will not give the password in his payload
      if (response.data.admin_password === undefined) {
        var modalInstance = $uibModal.open({ // Error modal
          templateUrl: 'views/partials/modalErrorPassword.jade',
          controller: 'ErrorPasswordCtrl',
          backdrop: true,
          keyboard: true,
          backdropClick: true,
          size: 'lg'
        });
      } else { // It's the good password we change the state
        $uibModalInstance.close('ok');
        $state.go(action, {instId: instId, pollId: pollId, pass: $scope.pass});
      }
    });
  }

  // Cancel button
  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});

// Controller of the error modal
northPoll.controller("ErrorPasswordCtrl", function ($scope, $uibModalInstance) {
  $scope.close = function () {
    $uibModalInstance.close();
  };
});

/* This angular controller is used in the creation and modificaation process of
 a poll. For now only the creation process is done. The update process will have
 to wait for the next step.*/
northPoll.controller("PollController", function ($scope, $http, $state, $stateParams, $uibModal) {


  $scope.actionString = "Créer le sondage";
  $scope.create = $state.current.name === "createPoll";
  $scope.edit = $state.current.name === "editPoll";

  /* The current pollID. When creating a new poll this is undefined and will be
   set when the poll is posted.*/
  $scope.pollId = "none";

  instances = [];

  $scope.questionAvailable = false;
  $scope.deletePossible = false;
  $scope.instanceAvailable = false;
  $scope.isPublic = false;

  if ($scope.edit) {
    $scope.actionString = "Modifier le sondage";
    $scope.questionAvailable = true;
    $scope.deletePossible = true;
    $scope.instanceAvailable = true;

    $http.get("/api/polls/" + $stateParams.pollId + "?pass=" + $stateParams.pass + "&typePass=admin").then(function (response) {
      $scope.pollName = response.data.name;
      $scope.adminName = response.data.creator;
      $scope.adminPassword = response.data.admin_password;
      $scope.adminPasswordConfirmation = response.data.admin_password;
      $scope.userPassword = response.data.user_password;
      $scope.userPasswordConfirmation = response.data.user_password;
      $scope.isPublic = response.data.public_results;
      $scope.pollId = response.data.id;
      $scope.pollState = response.data.state;
    }, function () {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partials/modalErrorPassword.jade',
        controller: 'ErrorPasswordCtrl',
        backdrop: true,
        keyboard: true,
        backdropClick: true,
        size: 'lg'
      });
      $state.go('listPolls');
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

  $scope.checkFormFields = function () {
    formOk = true;
    if ($scope.pollName == null || $scope.pollName.length < 1) {
      $scope.pollNameValid = false;
      formOk = false;
    }
    else {
      $scope.pollNameValid = true;
    }

    if ($scope.adminName == null || $scope.adminName.length < 1) {
      $scope.adminNameValid = false;
      formOk = false;
    }
    else {
      $scope.adminNameValid = true;
    }

    if ($scope.adminPassword == null || $scope.adminPassword.length < 1) {
      $scope.adminPasswordValid = false;
      formOk = false;
    }
    else {
      $scope.adminPasswordValid = true;
    }

    if (!($scope.adminPassword === $scope.adminPasswordConfirmation)) {
      $scope.adminPasswordConfirmationValid = false;
      formOk = false;
    }
    else {
      $scope.adminPasswordConfirmationValid = true;
    }

    if (!($scope.userPassword === $scope.userPasswordConfirmation)) {
      $scope.userPasswordConfirmationValid = false;
      formOk = false;
    }
    else {
      $scope.userPasswordConfirmationValid = true;
    }

    return formOk;
  }

  $scope.createPoll = function () {

    if (!$scope.checkFormFields()) {
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
      openModal($uibModal, "Succès!", "Le sondage a été créé", "alert-success");
      // We retrieve the pollId.
      $scope.pollId = data.id;
      // New actions are now available.
      $scope.edit = true;
      $scope.create = false;
      $scope.questionAvailable = true;
      $scope.instanceAvailable = true;
      $state.go("editPoll", {pollId: $scope.pollId, pass: $scope.adminPassword});

    }).error(function (data, status, headers, config) {
      openModal($uibModal, "Erreur!", "Le sondage n'a pas pu être créé", "alert-danger");
    });
  }

  $scope.updatePoll = function () {
    if (!$scope.checkFormFields()) {
      return;
    }

    $http({
      url: "/api/polls/" + $scope.pollId,
      method: "PUT",
      data: {
        name: $scope.pollName,
        creator: $scope.adminName,
        admin_password: $scope.adminPassword,
        user_password: $scope.userPassword,
        state: $scope.pollState,
        public_results: $scope.isPublic
      }
    }).success(function (data, status, headers, config) {
      openModal($uibModal, "Succès!", "Le sondage a été modifié", "alert-success");
    }).error(function (data, status, headers, config) {
      openModal($uibModal, "Erreur!", "Impossible d'éditer le sondage", "alert-danger");
    });
  }

  $scope.manageQuestions = function () {
    $state.go('manageQuestions', {pollId: $scope.pollId, pass: $scope.adminPassword});
  }

  $scope.manageInstances = function () {
    $state.go('manageInstances', {pollId: $scope.pollId, pass: $scope.adminPassword});
  }

  /* We remove the poll. */
  $scope.deletePoll = function () {
    $http({
      url: "/api/polls/" + $scope.pollId,
      method: "DELETE",
      data: {}
    }).success(function (data, status, headers, config) {
      openModal($uibModal, "Succès!", "Le sondage a été supprimé", "alert-success");
      $state.go('listPolls');
    }).error(function (data, status, headers, config) {
      openModal($uibModal, "Erreur!", "Le sondage n'a pas pu être supprimé", "alert-danger");
    });
  }
});

// Controller for the manage questions part
northPoll.controller("manageQuestsCtrl", function ($scope, $stateParams, $http, $uibModal, $state) {
  $scope.questions = [];
  $scope.choices = [{text: '', correct: false}]; // At start, we have a empty choice
  $scope.modify = false;
  $scope.isOptional = false;
  $scope.questionTextValid = true;
  $scope.numberOfPossibleChoicesValid = true;

  // We get the questions for the dropdown list
  $http.get("/api/polls/" + $stateParams.pollId + "/questions?pass=" + $stateParams.pass + "&typePass=admin").then(function (response) {
    $scope.questions = $scope.questions.concat(response.data.questions);
  });

  // Add the choice in the lower part of the UI to the array and renitialize the fields.
  $scope.addChoice = function () {
    if ($scope.choices[$scope.choices.length - 1].text === '') {
      openModal($uibModal, "Erreur!", "Le texte d'un choix ne peut pas être vide !", "alert-danger");
      return;
    }

    $scope.choices.push({text: '', correct: false});
  }

  // We select a question, we enter in modification mode
  $scope.selectChoice = function () {
    $scope.modify = true;
    $scope.questionText = $scope.select.text;
    $scope.maxChoices = $scope.select.choices_available;
    $scope.isOptional = $scope.select.optional;
    $scope.choices = $scope.select.choices;
  }

  /* Add the question to the poll. If an error is encountered an alert is displayed.
   Upon success the fields are renitialized and an alret is also displayed. */
  $scope.addQuestion = function () {

    if ($scope.questionText == null || $scope.questionText === '') {
      $scope.questionTextValid = false;
    }
    else {
      $scope.questionTextValid = true;
    }

    if ($scope.maxChoices == null || $scope.maxChoices === ''
      || $scope.maxChoices < 0 || $scope.maxChoices > $scope.choices.length) {
      $scope.numberOfPossibleChoicesValid = false;
    }
    else {
      $scope.numberOfPossibleChoicesValid = true;
    }

    if (!$scope.questionTextValid || !$scope.numberOfPossibleChoicesValid) {
      return;
    }

    // We create the question in the DB
    $http.post("/api/polls/" + $stateParams.pollId + "/questions",
      {
        text: $scope.questionText,
        choices_available: $scope.maxChoices,
        optional: $scope.isOptional,
        choices: $scope.choices
      }
    ).then(function (response) {
        $scope.questions = $scope.questions.concat(response.data.questions);
        openModal($uibModal, "Succès!", "La question a correctement été ajoutée au sondage", "alert-success");
      }, function (response) {
        openModal($uibModal, "Erreur!", "Impossible d'ajouter cette question, " + response.data.errors[0] +
          " semble ne pas être correctement renseigné", "alert-danger");
      });
  }

  // Modification of a question
  $scope.modifyQuestion = function () {
    $http.put("/api/polls/" + $stateParams.pollId + "/questions/" + $scope.select.id,
      {
        text: $scope.questionText,
        choices_available: $scope.maxChoices,
        optional: $scope.isOptional,
        choices: $scope.choices
      }
    ).then(function (response) {
        openModal($uibModal, "Succès!", "Cette question a correctement été mise à jour", "alert-success");
      }, function (response) {
        openModal($uibModal, "Erreur!", "Impossible de mettre à jour cette question", "alert-danger");
      });
  }

  // Create a new question, we reinitialize fields and enter in create mode
  $scope.createNewQuestion = function () {
    $scope.modify = false;
    $scope.questionText = undefined;
    $scope.maxChoices = undefined;
    $scope.isOptional = false;
    $scope.select = undefined;
    $scope.choices = [{text: '', correct: false}];
  }

  // Back to edit poll menu
  $scope.backToPoll = function () {
    $state.go('editPoll', {pollId: $stateParams.pollId, pass: $stateParams.pass});
  }
});

// This angular controller will handle the response process. It is responsible of everything related to the answer fragment of the page.
northPoll.controller("AnswerCtrl", function ($scope, $http, $uibModal, mySocket, $stateParams, $state) {

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

        openModal($uibModal, "Réponses envoyées!", "Vous avez participé au sondage, les résultats ont été envoyés.", "alert-success");

      }).error(function (data, status, headers, config) {
        openModal($uibModal, "Erreur!", "Vos résultats n'ont pas pu être envoyés", "alert-danger");
      });

      $state.go('listPolls');
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

northPoll.controller("modalMessageCtrl", function ($scope, $uibModalInstance, msg, txt, colorClass) {
  $scope.close = function () {
    $uibModalInstance.close();
  };

  // The popup will automatically close after 4 seconds
  setTimeout(function () {
    $scope.close();
  }, 4000);

  // We load the parameters
  $scope.msg = msg;
  $scope.txt = txt;
  $scope.colorClass = colorClass;
});

northPoll.controller("manageInstCtrl", function ($scope, $http, $state, $stateParams, $uibModal) {
  $scope.instances = [];
  $scope.pollId = $stateParams.pollId;

  // We load the instances
  $http.get("/api/polls/" + $scope.pollId + "/instances").then(function (response) {
    $scope.instances = response.data.instances;
  });

  // Adds an instance to the poll.
  $scope.addInstance = function () {
    $http({
      url: "/api/polls/" + $scope.pollId + "/instances",
      method: "POST",
      data: {name: $scope.instanceName}
    }).success(function (data, status, headers, config) {
      $scope.instanceName = "";
      $http.get("/api/polls/" + $scope.pollId + "/instances").then(function (response) {
        $scope.instances = response.data.instances;
      });
    }).error(function (data, status, headers, config) {
      openModal($uibModal, "Erreur!", "L'instance n'a pas pu être créée", "alert-danger");
    });
  }

  // Delete an instance
  $scope.deleteInstance = function (id) {
    $http({
      url: "/api/polls/" + $scope.pollId + "/instances/" + id,
      method: "DELETE"
    }).success(function (data, status, headers, config) {

      // If the instance was successfully deleted, no need to reload the instance array, we simply delete the row, on client side
      for (i in $scope.instances) {
        if ($scope.instances[i].id === id) {
          $scope.instances.remove(i);
          break;
        }
      }

      // If there's no more instances we close the poll for now.
      if ($scope.instances.length == 0) {
        $scope.closePoll();
      }
    }).error(function (data, status, headers, config) {
      openModal($uibModal, "Erreur!", "L'instance n'a pas pu être supprimée", "alert-danger");
    });
  }

  $scope.pollName = "";
  $scope.adminName = "";
  $scope.adminPassword = "";
  $scope.userPassword = "";
  $scope.isPublic = "";

  $scope.closePoll = function () {
    $http.get("/api/polls/" + $stateParams.pollId + "?pass=" + $stateParams.pass + "&typePass=user").then(function (response) {
      $scope.pollName = response.data.name;
      $scope.adminName = response.data.creator;
      $scope.adminPassword = response.data.admin_password;
      $scope.adminPasswordConfirmation = response.data.admin_password;
      $scope.userPassword = response.data.user_password;
      $scope.userPasswordConfirmation = response.data.user_password;
      $scope.isPublic = response.data.public_results;
      $scope.pollId = response.data.id;
      $scope.pollState = response.data.state;
      alert($scope.pollName);

      $http({
        url: "/api/polls/" + $scope.pollId,
        method: "PUT",
        data: {
          name: $scope.pollName,
          creator: $scope.adminName,
          admin_password: $scope.adminPassword,
          user_password: $scope.userPassword,
          state: "closed",
          public_results: $scope.isPublic
        }
      }).success(function (data, status, headers, config) {
        openModal($uibModal, "Succès", "Dernière instance supprimée. Le sondage a été fermé", "alert-success");
      }).error(function (data, status, headers, config) {
        openModal($uibModal, "Erreur!", "Impossible de fermer le sondage", "alert-danger");
      });
    }, function () {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partials/modalErrorPassword.jade',
        controller: 'ErrorPasswordCtrl',
        backdrop: true,
        keyboard: true,
        backdropClick: true,
        size: 'lg'
      });
      $state.go('listPolls');
    });
  }

  $scope.backToPoll = function () {
    $state.go('editPoll', {pollId: $scope.pollId, pass: $stateParams.pass});
  };

  $scope.showResults = function (id) {
    $state.go('statsInstancePoll', {pollId: $scope.pollId, instId: id, pass: $stateParams.pass});
  };
});
