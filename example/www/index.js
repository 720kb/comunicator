/*global angular*/
(function withAngular() {
  'use strict';

  angular.module('720kb.test', [
    '720kb.comunicator'
  ])

  .config(['ComunicatorProvider',
  function configFunction(ComunicatorProvider) {

    ComunicatorProvider.setComunicatorServerURL('ws://localhost:3001');
  }])

  .controller('TestController', ['$rootScope', '$scope', '$http', '$log', 'Comunicator',
  function TestController($rootScope, $scope, $http, $log, Comunicator) {

    let unregisterOnComunicatorJoin
      , unregisterOnComunicatorToMe
      , unregisterOnComunicatorToAll;

    $http.get('/token')
      .success(data => {

        $scope.token = data.token;
        $scope.userID = data.userID;
      })
      .error(data => {

        $log.debug(data);
      });

    $scope.resetFlags = function resetFlags() {

      $scope.message = undefined;
      $scope.eventData = undefined;
    };

    $scope.userIsPresent = function userIsPresent() {

      $scope.running = true;

      $scope.resetFlags();

      Comunicator.then(comunicator => {

        comunicator.userIsPresent($scope.userID, $scope.token);
      });
    };

    $scope.broadcast = function broadcast() {

      $scope.running = true;
      $scope.resetFlags();

      Comunicator.then(comunicator => {

        comunicator.broadcast({
          'message': $scope.what
        });
      });
    };

    $scope.sendTo = function sendTo() {

      $scope.running = true;
      $scope.resetFlags();

      Comunicator.then(comunicator => {

        comunicator.sendTo($scope.userID, {
          'message': $scope.what
        });
      });
    };

    unregisterOnComunicatorJoin = $rootScope.$on('comunicator:joined', (eventInfo, data) => {

      $scope.running = false;
      $scope.eventData = data;
      $scope.message = 'Connected to comunicator';
    });
    unregisterOnComunicatorToMe = $rootScope.$on('comunicator:to-me', (eventInfo, data) => {

      $scope.running = false;
      $scope.eventData = data;
      $scope.message = 'A message from comunicator, for you.';
    });

    unregisterOnComunicatorToAll = $rootScope.$on('comunicator:to-all', (eventInfo, data) => {

      $scope.running = false;
      $scope.eventData = data;
      $scope.message = 'A message from comunicator, for all the people.';
    });

    $scope.$on('$destroy', () => {

      unregisterOnComunicatorToMe();
      unregisterOnComunicatorJoin();
      unregisterOnComunicatorToAll();
    });
  }]);
}(angular));
