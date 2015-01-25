/*global angular window*/

(function withAngular(angular, window) {
  'use strict';

  angular.module('720kb.notifier', [])
  .provider('Notifier', function providerFunction() {

    var websocket
      , deferred
      , timeWaitSlice = 64
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
          , chosenTimeWaitValue = 0
          , nextTimeWaitSliceChoice
          , sendPendingRequests = []
          , joinPendingRequests = []
          , onTick = function onTick(redoFunction, type) {

              if (chosenTimeWaitValue > 0 &&
                websocket.readyState !== $window.WebSocket.OPEN) {

                chosenTimeWaitValue -= 1;
                //$log.info('Decreasing chosen time wait value.');
                var requestId = $window.requestAnimationFrame(onTick.bind(this, redoFunction));
                if (type === 'send') {

                  sendPendingRequests.push(requestId);
                } else {

                  joinPendingRequests.push(requestId);
                }
              } else {

                nextTimeWaitSliceChoice = timeWaitSlice * (Math.pow(2, timeWaitSliceChoices.length) - 1);
                timeWaitSliceChoices.push(nextTimeWaitSliceChoice);
                chosenTimeWaitValue = giveMeATimeWait();
                //$log.info('Chosen time wait value:', chosenTimeWaitValue);
                redoFunction();
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
          , onWebsocketClose = function onWebsocketClose() {

              if (whoReallyAmI &&
                reallyToken) {

                $rootScope.$emit('notifier:closed');
                /*eslint-disable no-use-before-define*/
                doJoin();
                /*eslint-enable no-use-before-define*/
              }
            }
          , sendMessage = function send(opcode, data) {

              var onTickBoundedOnSend = onTick.bind(this, sendMessage.bind(this, opcode, data), 'send')
                , requestId
                , sendPendingRequestsIndex = 0
                , sendPendingRequestsLength
                , aPendingRequest;
              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.push(JSON.stringify({
                  'opcode': opcode,
                  'token': reallyToken,
                  'data': data
                }));

                for (sendPendingRequestsIndex = 0, sendPendingRequestsLength = sendPendingRequests.length; sendPendingRequestsIndex < sendPendingRequestsLength; sendPendingRequestsIndex += 1) {

                  aPendingRequest = sendPendingRequests[sendPendingRequestsIndex];
                  $window.cancelAnimationFrame(aPendingRequest);
                }
                sendPendingRequests = [];
              } else {

                $log.info('Trasport to server is not ready. Delay sending...');
                requestId = $window.requestAnimationFrame(onTickBoundedOnSend);
                sendPendingRequests.push(requestId);
              }
            }
          , doJoin = function doJoin() {

              var onTickBoundedOnDoJoin = onTick.bind(this, doJoin, 'join')
                , requestId
                , joinPendingRequestsIndex = 0
                , joinPendingRequestsLength
                , aPendingRequest;
              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.push(JSON.stringify({
                  'opcode': 'join',
                  'whoami': whoReallyAmI,
                  'token': reallyToken
                }));


                for (joinPendingRequestsIndex = 0, joinPendingRequestsLength = joinPendingRequests.length; joinPendingRequestsIndex < joinPendingRequestsLength; joinPendingRequestsIndex += 1) {

                  aPendingRequest = joinPendingRequests[joinPendingRequestsIndex];
                  $window.cancelAnimationFrame(aPendingRequest);
                }
                joinPendingRequests = [];
              } else if (websocket.readyState === $window.WebSocket.CONNECTING) {

                $log.info('Trasport to server is not yet ready. Delay joining...');
                requestId = $window.requestAnimationFrame(onTickBoundedOnDoJoin);
                joinPendingRequests.push(requestId);
              } else {

                $log.info('Trasport to server is down by now. Delay joining...');
                setNotifierServerURL(websocket.url);
                websocket.send = sendMessage;
                websocket.onmessage = onWebsocketMessage;
                websocket.onclose = onWebsocketClose;
                requestId = $window.requestAnimationFrame(onTickBoundedOnDoJoin);
                joinPendingRequests.push(requestId);
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
        websocket.onclose = onWebsocketClose;

        return deferred.promise;
      }]
    };
  });
}(angular, window));

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function rafPolyfill(window) {
  'use strict';

  var lastTime = 0
    , vendors = ['ms', 'moz', 'webkit', 'o']
    , x = 0;

  for (; x < vendors.length && !window.requestAnimationFrame; x += 1) {

    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {

    window.requestAnimationFrame = function rafPolyfill(callback) {
      var currTime = new Date().getTime()
        , timeToCall = Math.max(0, 16 - (currTime - lastTime))
        , id = window.setTimeout(function endTimeOut() {
            callback(currTime + timeToCall);
          }, timeToCall);

      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {

    window.cancelAnimationFrame = function cafPolyfill(id) {
      window.clearTimeout(id);
    };
  }
}(window));
