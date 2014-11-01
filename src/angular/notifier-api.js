/*global angular window*/

(function withAngular(angular, window) {
  'use strict';

  angular.module('720kb.notifier', [])
  .provider('Notifier', function providerFunction() {

    var webSocketURL
      , whenAwareOfPresenceEvents;

    return {
      'setNotifierServerURL': function setNotifierServerURL(url) {

        if (url) {

          webSocketURL = url;
        } else {

          window.console.error('Please provide a valid URL.');
        }
      },
      'setWhenAwareOfPresenceEvents': function setWhenAwareOfPresenceEvents(events) {

        if (events) {

          whenAwareOfPresenceEvents = events;
        } else {

          window.console.error('Provide some events where register the user presence notifier call');
        }
      },
      '$get': ['$window', '$rootScope', 'sessionFactory', function instantiateProvider($window, $rootScope, sessionFactory) {

        if (!webSocketURL ||
          !whenAwareOfPresenceEvents) {
            $window.console.error('Mandatory fields notifierServerURL and whenAwareOfPresenceEvents required', webSocketURL, whenAwareOfPresenceEvents);
        }

        var websocket = new $window.WebSocket(webSocketURL)
          , whoami = sessionFactory.get('idUser')
          , token = sessionFactory.get('sessionToken')
          , userIsPresent = function userIsPresent() {

              if (whoami &&
                token) {

                if (websocket.readyState === $window.WebSocket.OPEN) {

                  websocket.push(JSON.stringify({
                    'opcode': 'join',
                    'whoami': whoami,
                    'token': token
                  }));
                } else {

                  $window.console.warn('Trasport to server is not yet ready. ' +
                    'This could be a notifier bug. ' +
                    'Please report this use case for scenario reproduction.');
                }
              }
            }
          , broadcast = function broadcast(what) {

              if (!!whoami &&
                !!websocket) {

                var toSend = {
                  'whoami': whoami,
                  'who': '*',
                  'what': what
                };

                websocket.send('broadcast', toSend);
              } else {

                $window.console.error('User identification required');
              }
            }
          , sendTo = function sendTo(who, what) {

              if (!!whoami &&
                !!websocket) {

                var toSend = {
                  'whoami': whoami,
                  'who': who,
                  'what': what
                };

                websocket.send('sendTo', toSend);
              } else {

                $window.console.error('User identification required');
              }
            };

        websocket.push = websocket.send;
        websocket.onopen = function onWebSocketOpening() {

          angular.forEach(whenAwareOfPresenceEvents, function forEachFunction(value) {

            $rootScope.$on(value, userIsPresent);
          });
          $window.console.info('Trasport', this, 'opened.');
        };

        websocket.send = function send(opcode, data) {

          if (websocket.readyState === $window.WebSocket.OPEN) {

            websocket.push(JSON.stringify({
              'opcode': opcode,
              'token': token,
              'data': data
            }));
          } else {

            $window.console.warn('Trasport to server is not ready.');
          }
        };

        websocket.onmessage = function onWebSocketMessage(event) {

          var parsedMsg = JSON.parse(event.data);
          if (parsedMsg.opcode === 'joined') {

            whoami = parsedMsg.whoami;
            token = parsedMsg.token;
          } else if (parsedMsg.opcode === 'sent') {

            $rootScope.$emit('directNotificationArrived', parsedMsg);
          } else if (parsedMsg.opcode === 'broadcasted') {

            $rootScope.$emit('broadcastNotificationArrived', parsedMsg);
          }
        };

        return {
          'broadcast': broadcast,
          'sendTo': sendTo
        };
      }]
    };
  });
}(angular, window));
