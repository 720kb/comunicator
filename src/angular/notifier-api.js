/*global angular window*/

(function (angular, window) {
  'use strict';

  angular.module('emotion.providers', [])
   .provider('EmotionNotifier', function () {

    var webSocketURL;

    return {
      'setWebSocketNotifierServer': function (value) {

        if (value) {

          webSocketURL = value;
        } else {

          window.console.error('Please provide a valid URL.');
        }
      },
      '$get': ['$window', '$timeout', '$rootScope', 'sessionFactory', function ($window, $timeout, $rootScope, sessionFactory) {

        var websocket = new $window.WebSocket(webSocketURL)
          , whoami
          , token
          , userIsPresent = function () {

              var jwtToken = sessionFactory.get('sessionToken')
                , toSendWhoami = sessionFactory.get('idUser');

              if (!whoami &&
                !token &&
                jwtToken &&
                toSendWhoami) {

                if (websocket.readyState === $window.WebSocket.OPEN) {

                  websocket.push(JSON.stringify({
                    'opcode': 'join',
                    'whoami': toSendWhoami,
                    'token': jwtToken
                  }));
                }
              }
            }
          , broadcast = function (what) {

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
          , sendTo = function (who, what) {

              if (!!whoami &&
                !!websocket) {

                var toSend = {
                  'whoami': whoami,
                  'who': who,
                  'what': what
                };

                websocket.send('sendTo', toSend);
              } else {

                $window.console.error('User identification required for');
              }
            };

        websocket.push = websocket.send;
        websocket.onopen = function () {

          $window.console.info('WebSocket', this, 'opened.');
        };

        websocket.send = function (opcode, data) {

          if (websocket.readyState === $window.WebSocket.OPEN) {

            websocket.push(JSON.stringify({
              'opcode': opcode,
              'token': token,
              'data': data
            }));
          }
        };

        websocket.onmessage = function (event) {

          var parsedMsg = JSON.parse(event.data);

          if (parsedMsg.opcode === 'joined') {

            whoami = parsedMsg.whoami;
            token = parsedMsg.token;

          } else if (parsedMsg.opcode === 'sent') {

            $rootScope.$broadcast('directNotificationArrived', parsedMsg);
          } else if (parsedMsg.opcode === 'broadcasted') {

            $rootScope.$broadcast('broadcastNotificationArrived', parsedMsg);
          }
        };

        angular.forEach(['auth:loginDone', 'auth:signupDone', 'contacts:myContactsRetrieved'], function (value) {

            $rootScope.$on(value, userIsPresent);
        });

        return {
          'broadcast': broadcast,
          'sendTo': sendTo
        };
      }]
    };
  });
}(angular, window));
