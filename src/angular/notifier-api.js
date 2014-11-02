/*global angular document window*/

(function withAngular(angular, document, window) {
  'use strict';

  angular.module('720kb.notifier', [])
  .provider('Notifier', function providerFunction() {

    var websocket
      , whoami
      , token
      , doJoin = function() {

          if (websocket.readyState === window.WebSocket.OPEN) {

            websocket.push(JSON.stringify({
              'opcode': 'join',
              'whoami': whoami,
              'token': token
            }));
          } else {

            window.console.info('Trasport to server is not yet ready. Retry...');
            window.requestAnimationFrame(doJoin);
          }
        }
      , userIsPresent = function userIsPresent(eventsInformations, data) {/*{'userId': '<user-identification>', 'token': '<user-security-token>'}*/
          whoami = data.userId;
          token = data.token;

          if (whoami &&
            token) {

            doJoin();
          } else {

            window.console.error('User identification datas missing.');
          }
        };
    return {
      'configureNotifier': function configureNotifier(url, events) {

        if (url &&
          events) {

          websocket = new window.WebSocket(url);
          websocket.onopen = function onWebSocketOpening() {

            window.console.info('Trasport', this, 'opened.');
          };

          angular.forEach(events, function forEachFunction(value) {

            angular.element(document.querySelector('*[ng-app]')).scope().$on(value, userIsPresent);
          });
        } else {

          window.console.error('Please provide a valid URL or ' +
            'provide some events where register the user presence notifier call');
        }
      },
      '$get': ['$window', '$rootScope', function instantiateProvider($window, $rootScope) {

        var complainMessage
          , broadcast = function broadcast(what) {

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

        if (!websocket) {

          complainMessage = 'Configuration was incomplete.';
          $window.console.error(complainMessage, websocket);
          throw complainMessage;
        }

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

        return {
          'broadcast': broadcast,
          'sendTo': sendTo
        };
      }]
    };
  });
}(angular, document, window));
