/*global angular*/
'use strict';

angular.module('720kb.test', [
  '720kb.comunicator'
])
.config(['ComunicatorProvider',
function configFunction(ComunicatorProvider) {

  ComunicatorProvider.setComunicatorServerURL('ws://localhost:3001');
}])

.controller('TestController', ['$rootScope', '$scope', '$http', '$log', 'Comunicator',
function TestController($rootScope, $scope, $http, $log, comunicator) {

  const joinedSubscription = comunicator
        .filter(element => element.type === 'joined')
        .subscribe({
          'next': val => {

            $scope.$apply(() => {

              this.message = 'Connected to comunicator';
              this.elementData = val;
            });
          }
        })
      , toMeSubscription = comunicator
        .filter(element => element.type === 'to-me')
        .subscribe({
          'next': val => {

            $scope.$apply(() => {

              this.message = 'A message from comunicator, for you.';
              this.elementData = val;
            });
          }
        })
      , toAllSubscription = comunicator
        .filter(element => element.type === 'to-all')
        .subscribe({
          'next': val => {

            $scope.$apply(() => {

              this.message = 'A message from comunicator, for all the people.';
              this.elementData = val;
            });
          }
        });

  $http.get('/token')
    .success(data => {

      this.token = data.token;
      this.userID = data.userID;
    })
    .error(data => {

      $log.debug(data);
    });

  this.resetFlags = function resetFlags() {

    this.message = undefined;
    this.elementData = undefined;
  };

  this.userIsPresent = () => {

    this.resetFlags();
    comunicator.userIsPresent(this.userID, this.token);
  };

  this.broadcast = () => {

    this.resetFlags();
    comunicator.broadcast(this.what);
  };

  this.sendTo = user => {

    if (user &&
      !isNaN(user)) {

      this.resetFlags();
      comunicator.sendTo(Number(user), this.what);
    } else {

      throw new Error('User is not a valid number');
    }
  };

  this.exit = () => {

    this.resetFlags();
    joinedSubscription.unsubscribe();
    toMeSubscription.unsubscribe();
    toAllSubscription.unsubscribe();
    this.token = undefined;
    this.userID = undefined;
  };

  $scope.$on('$destroy', () => {

    joinedSubscription.unsubscribe();
    toMeSubscription.unsubscribe();
    toAllSubscription.unsubscribe();
  });
}]);
