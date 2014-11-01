/*global angular window*/

(function withAngular(angular, window) {
  'use strict';

  angular.module('720kb.notifier', [])
  .provider('Notifier', function providerFunction() {

    var websocket
      , whenAwareOfPresenceEvents;

    websocket.onopen = function onWebSocketOpening() {

      $window.console.info('Trasport', this, 'opened.');
    };

    return {
      'setNotifierServerURL': function setNotifierServerURL(url) {

        if (url) {

          websocket = new $window.WebSocket(url)
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
      '$get': ['$window', '$rootScope', function instantiateProvider($window, $rootScope) {

        if (!websocket ||
          !whenAwareOfPresenceEvents) {

            var complainMessage = 'Mandatory fields notifierServerURL and whenAwareOfPresenceEvents required';
            $window.console.error(complainMessage, websocket, whenAwareOfPresenceEvents);
            throw complainMessage;
        }

        var whoami
          , token
          , doJoin = function() {

              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.push(JSON.stringify({
                  'opcode': 'join',
                  'whoami': whoami,
                  'token': token
                }));
              } else {

                $window.console.info('Trasport to server is not yet ready. Retry...');
                $window.requestAnimationFrame(doJoin);
              }
            }
          , userIsPresent = function userIsPresent(eventsInformations, data) {/*{'userId': '<user-identification>', 'token': '<user-security-token>'}*/
              whoami = data.userId;
              token = data.token;

              if (whoami &&
                token) {

                doJoin();
              } else {

                $window.console.error('User identification datas missing.');
              }
            };

        websocket.push = websocket.send;
        websocket.send = function send(opcode, data) {

          if (websocket.readyState === $window.WebSocket.OPEN) {

            websocket.push(JSON.stringify({
              'opcode': opcode,
              'token': token,
              'data': data
            }));
          } else {

            $window.console.info('Trasport to server is not ready.');
            $window.requestAnimationFrame(websocket.send.apply(this, [opcode, data]));
          }
        };

        websocket.onmessage = function onWebSocketMessage(event) {

          var parsedMsg = JSON.parse(event.data);
          if (parsedMsg.opcode === 'joined') {

            $rootScope.$emit('notifier:joined');
          } else if (parsedMsg.opcode === 'sent') {

            $rootScope.$emit('notifier:toMe', parsedMsg);
          } else if (parsedMsg.opcode === 'broadcasted') {

            $rootScope.$emit('notifier:toAll', parsedMsg);
          }
        };

        angular.forEach(whenAwareOfPresenceEvents, function forEachFunction(value) {

          $rootScope.$on(value, userIsPresent);
        });

        var broadcast = function broadcast(what) {

              if (whoami &&
                websocket) {

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

              if (whoami &&
                websocket) {

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
        return {
          'broadcast': broadcast,
          'sendTo': sendTo
        };
      }]
    };
  });
}(angular, window));
