/*global angular Comunicator*/
(function withAngular(angular, Comunicator) {
  'use strict';

  angular.module('720kb.comunicator', [])
  .provider('Comunicator', function providerFunction() {

    var comunicator
      , initComunicator = function initComunicator(url) {

        comunicator = new Comunicator(url);
        return comunicator;
      };

    return {
      'setComunicatorServerURL': initComunicator,
      '$get': ['$rootScope', '$window', '$log',
      function instantiateProvider($rootScope, $window, $log) {

        var eventsToListen = ['$stateChangeSuccess', '$routeChangeSuccess']
          , domEvent = 'comunicator:ready'
          , unregisterListeners = []
          , eventsToListenLength = eventsToListen.length
          , eventsToListenIndex = 0
          , anEventToListen
          , arrivedJoined = function arrivedJoined() {

            $rootScope.$apply(function doApply(scope) {

              scope.$emit('comunicator:joined');
            });

            $log.debug('comunicator:joined dispatched');
          }
          , arrivedToMe = function arrivedToMe(event) {

            $rootScope.$apply(function doApply(scope) {

              scope.$emit('comunicator:to-me', event.detail);
            });

            $log.debug('comunicator:to-me dispatched');
          }
          , arrivedToAll = function arrivedToAll(event) {

            $rootScope.$apply(function doApply(scope) {

              scope.$emit('comunicator:to-all', event.detail);
            });

            $log.debug('comunicator:to-all dispatched');
          }
          , arrivedClosed = function arrivedClosed() {

            $rootScope.$apply(function doApply(scope) {

              scope.$emit('comunicator:closed');
            });

            $log.debug('comunicator:closed dispatched');
          }
          , resolveComunicator = function resolveComunicator() {

            var unregisterListenersIndex = 0
              , unregisterListenersLength = unregisterListeners.length
              , kickOffEvent = new $window.Event(domEvent);

            for (; unregisterListenersIndex < unregisterListenersLength; unregisterListenersIndex += 1) {

              unregisterListeners[unregisterListenersIndex]();
            }

            $window.dispatchEvent(kickOffEvent);
            $log.debug('KickOff DOM Event triggered');
          };

        $window.addEventListener('comunicator:joined', arrivedJoined, false);
        $window.addEventListener('comunicator:to-me', arrivedToMe, false);
        $window.addEventListener('comunicator:to-all', arrivedToAll, false);
        $window.addEventListener('comunicator:closed', arrivedClosed, false);

        $rootScope.$on('$destroy', function unregisterEventListener() {

          $window.removeEventListener('comunicator:joined', arrivedJoined, false);
          $window.removeEventListener('comunicator:to-me', arrivedToMe, false);
          $window.removeEventListener('comunicator:to-all', arrivedToAll, false);
          $window.removeEventListener('comunicator:closed', arrivedClosed, false);
        });

        for (; eventsToListenIndex < eventsToListenLength; eventsToListenIndex += 1) {

          anEventToListen = eventsToListen[eventsToListenIndex];
          unregisterListeners.push($rootScope.$on(anEventToListen, resolveComunicator));
        }

        return comunicator.promise([domEvent]);
      }]
    };
  });
}(angular, Comunicator));
