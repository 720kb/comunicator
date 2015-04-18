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

      var OnComunicatorJoin
        , OnComunicatorToMe
        , OnComunicatorToAll;

      $http.get('/token')
        .success(function onSuccess(data) {

          $scope.token = data.token;
          $scope.userID = data.userID;

          $rootScope.$emit('$routeChangeSuccess');
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

          comunicator.broadcast({'message': $scope.what});
        });
      };

      $scope.sendTo = function sendTo() {

        $scope.running = true;
        $scope.resetFlags();

        Comunicator.then(function onComunicator(comunicator) {

          comunicator.sendTo($scope.userID, {'message': $scope.what});
        });
      };

      OnComunicatorJoin = $rootScope.$on('comunicator:joined', function (eventInfo, data) {

        $scope.running = false;
        $scope.eventData = data;
        $scope.message = 'Connected to comunicator';
      });
      OnComunicatorToMe = $rootScope.$on('comunicator:to-me', function (eventInfo, data) {

        $scope.running = false;
        $scope.eventData = data;
        $scope.message = 'A message from comunicator, for you.';
      });

      OnComunicatorToAll = $rootScope.$on('comunicator:to-all', function (eventInfo, data) {

        $scope.running = false;
        $scope.eventData = data;
        $scope.message = 'A message from comunicator, for all the people.';
      });

      $scope.$on('$destroy', function () {

        OnComunicatorToMe();
        OnComunicatorJoin();
        OnComunicatorToAll();
      });
  }]);
}(angular, Comunicator));
