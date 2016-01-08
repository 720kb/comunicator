/*global angular*/
(function withAngular(angular) {
  'use strict';

  angular.module('720kb.test', [
    '720kb.comunicator'
  ])

  .config(['ComunicatorProvider',
  function configFunction(ComunicatorProvider) {

    ComunicatorProvider.setComunicatorServerURL('ws://localhost:9876');
  }])

  .controller('TestController', ['$rootScope', '$scope', '$http', '$log', 'Comunicator',
  function TestController($rootScope, $scope, $http, $log, Comunicator) {

    var unregisterOnComunicatorJoin
      , unregisterOnComunicatorToMe
      , unregisterOnComunicatorToAll;

    $http.get('/token')
      .success(function onSuccess(data) {

        $scope.token = data.token;
        $scope.userID = data.userID;
      })
      .error(function onError(data) {

        $log.debug(data);
      });

    $scope.resetFlags = function resetFlags() {

      $scope.message = undefined;
      $scope.eventData = undefined;
    };

    $scope.userIsPresent = function userIsPresent() {

      $scope.running = true;

      $scope.resetFlags();

      Comunicator.then(function onComunicator(comunicator) {

        comunicator.userIsPresent($scope.userID, $scope.token);
      });
    };

    $scope.broadcast = function broadcast() {

      $scope.running = true;
      $scope.resetFlags();

      Comunicator.then(function onComunicator(comunicator) {

        comunicator.broadcast({
          'message': $scope.what
        });
      });
    };

    $scope.sendTo = function sendTo() {

      $scope.running = true;
      $scope.resetFlags();

      Comunicator.then(function onComunicator(comunicator) {

        comunicator.sendTo($scope.userID, {
          'message': $scope.what
        });
      });
    };

    unregisterOnComunicatorJoin = $rootScope.$on('comunicator:joined', function onComunicatorJoined(eventInfo, data) {

      $scope.running = false;
      $scope.eventData = data;
      $scope.message = 'Connected to comunicator';
    });
    unregisterOnComunicatorToMe = $rootScope.$on('comunicator:to-me', function onComunicatorToMe(eventInfo, data) {

      $scope.running = false;
      $scope.eventData = data;
      $scope.message = 'A message from comunicator, for you.';
    });

    unregisterOnComunicatorToAll = $rootScope.$on('comunicator:to-all', function onComunicatorToAll(eventInfo, data) {

      $scope.running = false;
      $scope.eventData = data;
      $scope.message = 'A message from comunicator, for all the people.';
    });

    $scope.$on('$destroy', function destroyScope() {

      unregisterOnComunicatorToMe();
      unregisterOnComunicatorJoin();
      unregisterOnComunicatorToAll();
    });
  }]);
}(angular));
