/*global angular window*/

(function withAngular(angular, window) {
  'use strict';

  angular.module('720kb.notifier', [])
  .provider('Notifier', function providerFunction() {

    var websocket
      , deferred
      , timeWaitSlice = 16 /*ms*/
      , timeWaitSliceChoices = [0]
      , giveMeATimeWait = function giveMeATimeWait() {

          return Math.floor(Math.random() * (timeWaitSliceChoices.length + 1));
        }
      , setNotifierServerURL = function setNotifierServerURL(url) {

        if (url) {

          websocket = new window.WebSocket(url);
          websocket.onopen = function onWebSocketOpening() {

            window.console.info('Trasport', this, 'opened.');
          };
        } else {

          window.console.error('Please provide a valid URL.');
        }

        websocket.push = websocket.send;
      };

    return {
      'setNotifierServerURL': setNotifierServerURL,
      '$get': ['$window', '$rootScope', '$timeout', '$log', '$q',
      function instantiateProvider($window, $rootScope, $timeout, $log, $q) {

        deferred = $q.defer();
        var complainMessage
          , whoReallyAmI
          , reallyToken
          , sendMessage = function send(opcode, data) {

              var nextTimeWaitSliceChoice
                , chosenTimeWaitValue;
              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.push(JSON.stringify({
                  'opcode': opcode,
                  'token': reallyToken,
                  'data': data
                }));
              } else {

                nextTimeWaitSliceChoice = timeWaitSlice * (Math.pow(2, timeWaitSliceChoices.length) - 1);
                timeWaitSliceChoices.push(nextTimeWaitSliceChoice);
                chosenTimeWaitValue = giveMeATimeWait();
                $log.info('Trasport to server is not ready. Choosing between', timeWaitSliceChoices, 'the value', chosenTimeWaitValue);
                $timeout(websocket.send.apply(this, [opcode, data]), chosenTimeWaitValue);
              }
            }
          , onWebsocketMessage = function onWebSocketMessage(event) {

              var parsedMsg = JSON.parse(event.data);
              if (parsedMsg.opcode === 'joined') {

                $rootScope.$emit('notifier:joined');
              } else if (parsedMsg.opcode === 'sent') {

                $rootScope.$emit('notifier:toMe', parsedMsg);
              } else if (parsedMsg.opcode === 'broadcasted') {

                $rootScope.$emit('notifier:toAll', parsedMsg);
              }
            }
          , doJoin = function doJoin() {

              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.push(JSON.stringify({
                  'opcode': 'join',
                  'whoami': whoReallyAmI,
                  'token': reallyToken
                }));
              } else if (websocket.readyState === $window.WebSocket.CLOSED) {

                setNotifierServerURL(websocket.url);
                websocket.send = sendMessage;
                websocket.onmessage = onWebsocketMessage;
                doJoin();
              } else {

                $log.info('Trasport to server is not yet ready. Retry...');
                $window.requestAnimationFrame(doJoin);
              }
            }
          , userIsPresent = function userIsPresent(whoami, token) {
              whoReallyAmI = whoami;
              reallyToken = token;

              if (whoReallyAmI &&
                reallyToken) {

                doJoin();
              } else {

                $log.error('User identification datas missing.');
              }
            }
          , broadcast = function broadcast(what) {

              if (whoReallyAmI &&
                websocket) {

                var toSend = {
                  'whoami': whoReallyAmI,
                  'who': '*',
                  'what': what
                };

                websocket.send('broadcast', toSend);
              } else {

                $log.error('User identification required');
              }
            }
          , sendTo = function sendTo(who, what) {

              if (whoReallyAmI &&
                websocket) {

                var toSend = {
                  'whoami': whoReallyAmI,
                  'who': who,
                  'what': what
                };

                websocket.send('sendTo', toSend);
              } else {

                $log.error('User identification required');
              }
            }
          , doClose = function doClose() {

              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.close();
              }
            }
          , eventsToListen = ['$stateChangeSuccess', '$routeChangeSuccess']
          , unregisterListeners = []
          , eventsToListenLength = eventsToListen.length
          , eventsToListenIndex = 0
          , anEventToListen
          , resolveNotifier = function resolveNotifier() {

              var unregisterListenersIndex = 0
                , unregisterListenersLength = unregisterListeners.length;
              for (; unregisterListenersIndex < unregisterListenersLength; unregisterListenersIndex += 1) {

                unregisterListeners[unregisterListenersIndex]();
              }

              deferred.resolve({
                'userIsPresent': userIsPresent,
                'broadcast': broadcast,
                'sendTo': sendTo,
                'exit': doClose
              });
            };

        for (; eventsToListenIndex < eventsToListenLength; eventsToListenIndex += 1) {

          anEventToListen = eventsToListen[eventsToListenIndex];
          unregisterListeners.push($rootScope.$on(anEventToListen, resolveNotifier));
        }

        if (!websocket) {

          complainMessage = 'Mandatory field notifierServerURL required';
          $log.error(complainMessage, websocket);
          deferred.reject(complainMessage);
        }

        websocket.send = sendMessage;
        websocket.onmessage = onWebsocketMessage;

        return deferred.promise;
      }]
    };
  });
}(angular, window));
