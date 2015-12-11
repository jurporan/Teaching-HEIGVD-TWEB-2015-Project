var northPoll = angular.module('northPoll', [
  'ui.router',
  'chart.js',
  'btford.socket-io'
]);

// Ui-router
northPoll.config(function ($stateProvider) {
  $stateProvider.state('listPolls', {
    templateUrl: 'views/partials/polls.jade',
    url: '/'
  });
  $stateProvider.state('answerInstancePoll', {
    templateUrl: 'views/partials/answer.jade',
    url: '/answer'
  });
  $stateProvider.state('statsInstancePoll', {
    templateUrl: 'views/partials/statsPoll.jade',
    url: '/stats'
  });
  $stateProvider.state('createPoll', {
    templateUrl: 'views/partials/create_poll.jade',
    url: '/createPoll'
  })
});

// This factory is used to transmit between controllers an object which contain the object instance and his linked poll
northPoll.factory('ActualInstanceOfPoll', function () {
  return {instance: '', poll: ''};
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
northPoll.controller("statsInstanceController", function ($scope, $http, ActualInstanceOfPoll, mySocket) {

  // mySocket is actually not used, it will be in the third phase

  // Fetch names of actual instance and poll
  $scope.instanceName = ActualInstanceOfPoll.instance.name;
  $scope.pollName = ActualInstanceOfPoll.poll.name;

  $scope.questions = [];

  // http request to get all questions in the selected poll
  $http.get("/api/polls/" + ActualInstanceOfPoll.poll.id + "/questions").then(function (response) {

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

      // http request to get results of the actual question in the actual instance
      $http.get(
        "/api/polls/" + ActualInstanceOfPoll.poll.id +
        "/instances/" + ActualInstanceOfPoll.instance.id +
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
            $scope.questions[idxQuest].percentage.push(choice.nb_chosen * 100);

            // Ensure that this is the latest iteration
            if (idxQuest === arrResp.length - 1 && idx === arr.length - 1) {
              $scope.questions.forEach(function (question, idx, arr) {
                question.percentage.forEach(function (percentageChoice, idx, arr) {
                  // Divide each partial percentage to have correct percentage
                  question.percentage[idx] = percentageChoice / nbChoices;
                });
              });
            }
          });
        });
    });
  });
});

// List of polls controller
northPoll.controller("pollsController", function ($scope, $http, ActualInstanceOfPoll) {

  // Setter for the factory ActualInstanceOfPoll
  $scope.setActualInstanceOfPoll = function (inst, poll) {
    ActualInstanceOfPoll.instance = inst;
    ActualInstanceOfPoll.poll = poll;
  }

  // Function called when we click on particpate button
  $scope.participateInInstance = function (instance, poll) {
    $scope.setActualInstanceOfPoll(instance, poll);
  }

  // Function called when we click on stats button
  $scope.statsOfAnInstance = function (instance, poll) {
    $scope.setActualInstanceOfPoll(instance, poll);
  }

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
      });

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

/* This angular controller is used in the creation and modificaation process of
a poll. For now only the creation process is done. The update process will have
to wait for the next step.*/
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

  /* If the user is creating  a poll, we post the new poll informations, in the other case we update the poll. The update is not implemented yet.*/
  $scope.pollAction = function () {

    if ($scope.pollActionString == "Créer le sondage") {
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
        $scope.pollActionString = "Appliquer les modifications";
        $scope.pollActionDisabled = true;
        $scope.questionAvailable = true;
      }).error(function (data, status, headers, config) {
        alert("Erreur lors de l'envoi");
      });
    }

    else {
      // TODO : Update form
    }
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
northPoll.controller("AnswerCtrl", function ($scope, $http, ActualInstanceOfPoll, mySocket) {

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
  $scope.pollid = ActualInstanceOfPoll.poll.id;
  $scope.instanceid = ActualInstanceOfPoll.instance.id;

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
