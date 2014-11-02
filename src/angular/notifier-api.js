/*global angular window*/

(function withAngular(angular, window) {
  'use strict';

  angular.module('720kb.notifier', [])
  .provider('Notifier', function providerFunction() {

    var websocket;

    return {
      'setNotifierServerURL': function setNotifierServerURL(url) {

        if (url) {

          websocket = new window.WebSocket(url);
          websocket.onopen = function onWebSocketOpening() {

            window.console.info('Trasport', this, 'opened.');
          };
        } else {

          window.console.error('Please provide a valid URL.');
        }
      },
      '$get': ['$window', '$rootScope', function instantiateProvider($window, $rootScope) {

        var complainMessage
          , whoReallyAmI
          , reallyToken
          , doJoin = function doJoin() {

              if (websocket.readyState === $window.WebSocket.OPEN) {

                websocket.push(JSON.stringify({
                  'opcode': 'join',
                  'whoami': whoReallyAmI,
                  'token': reallyToken
                }));
              } else {

                $window.console.info('Trasport to server is not yet ready. Retry...');
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

                $window.console.error('User identification datas missing.');
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

                $window.console.error('User identification required');
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

                $window.console.error('User identification required');
              }
            };

        if (!websocket) {

          complainMessage = 'Mandatory field notifierServerURL required';
          $window.console.error(complainMessage, websocket);
          throw complainMessage;
        }

        websocket.push = websocket.send;
        websocket.send = function send(opcode, data) {

          if (websocket.readyState === $window.WebSocket.OPEN) {

            websocket.push(JSON.stringify({
              'opcode': opcode,
              'token': reallyToken,
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
          'userIsPresent': userIsPresent,
          'broadcast': broadcast,
          'sendTo': sendTo
        };
      }]
    };
  });
}(angular, window));
