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

      $http.get('/token')
        .success(function onSuccess(data) {

          $scope.token = data;
          $rootScope.$emit('$routeChangeSuccess');
        })
        .error(function onError(data) {

          $log.debug(data);
        });

      $scope.userIsPresent = function userIsPresent() {

        Comunicator.then(function onComunicator(comunicator) {

          comunicator.userIsPresent($scope.whoami, $scope.token);
        });
      };

      $scope.broadcast = function broadcast() {

        Comunicator.then(function onComunicator(comunicator) {

          comunicator.broadcast($scope.what);
        });
      };
  }]);
}(angular, Comunicator));
