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

      var OnComunicatorToMe
        , OnComunicatorToAll;

      $http.get('/token')
        .success(function onSuccess(data) {

          $scope.token = data;
          $rootScope.$emit('$routeChangeSuccess');
        })
        .error(function onError(data) {

          $log.debug(data);
        });

      $scope.resetFlags = function resetFlags() {

        $scope.toMe = undefined;
        $scope.toAll = undefined;
      };

      $scope.userIsPresent = function userIsPresent() {

        $scope.running = true;

        $scope.resetFlags();

        Comunicator.then(function onComunicator(comunicator) {

          comunicator.userIsPresent($scope.whoami, $scope.token);
        });
      };

      $scope.broadcast = function broadcast() {

        $scope.running = true;
        $scope.resetFlags();

        Comunicator.then(function onComunicator(comunicator) {

          comunicator.broadcast($scope.what);
        });
      };

      $scope.sendTo = function sendTo() {

        $scope.running = true;
        $scope.resetFlags();

        Comunicator.then(function onComunicator(comunicator) {

          comunicator.sendTo($scope.userID, $scope.what);
        });
      };

      OnComunicatorToMe = $rootScope.$on('comunicator:to-me', function (eventInfo, data) {

        $scope.running = false;
        $scope.toMe = data;
      });

      OnComunicatorToAll = $rootScope.$on('comunicator:to-all', function (eventInfo, data) {

        $scope.running = false;
        $scope.toAll = data;
      });

      $scope.$on('$destroy', function () {

        OnComunicatorToMe();
        OnComunicatorToAll();
      });
  }]);
}(angular, Comunicator));
