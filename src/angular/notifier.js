/*global angular window*/

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function rafPolyfill() {
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
}());

(function withAngular(angular, window) {
  'use strict';

  angular.module('720kb.notifier', [])
  .provider('Notifier', function providerFunction() {

    var websocket
      , deferred
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
      '$get': ['$window', '$rootScope', '$log', '$q', function instantiateProvider($window, $rootScope, $log, $q) {

        deferred = $q.defer();
        var complainMessage
          , whoReallyAmI
          , reallyToken
          , sendMessage = function send(opcode, data) {

              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.push(JSON.stringify({
                  'opcode': opcode,
                  'token': reallyToken,
                  'data': data
                }));
              } else {

                $log.info('Trasport to server is not ready.');
                $window.requestAnimationFrame(websocket.send.apply(this, [opcode, data]));
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
          , resolveNotifier = function resolveNotifier(unregisterListener) {

              deferred.resolve({
                'userIsPresent': userIsPresent,
                'broadcast': broadcast,
                'sendTo': sendTo,
                'exit': doClose
              });

              if (unregisterListener) {

                unregisterListener();
              }
            }
          , eventsToListen = ['$stateChangeSuccess', '$routeChangeSuccess']
          , eventsToListenLength = eventsToListen.length
          , eventsToListenIndex = 0
          , anEventToListen
          , unregisterListenerFunction;

        for (; eventsToListenIndex < eventsToListenLength; eventsToListenIndex += 1) {

          anEventToListen = eventsToListen[eventsToListenIndex];
          unregisterListenerFunction = $rootScope.$on(anEventToListen, resolveNotifier.bind(this, unregisterListenerFunction));
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
