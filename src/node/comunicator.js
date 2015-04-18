/*global module require process console, setTimeout clearTimeout*/
(function moduleExport(module, require, process, console, setTimeout, clearTimeout) {

  'use strict';
  var ws = require('ws')
    , jwt = require('jsonwebtoken')
    , EventEmitter = require('events').EventEmitter
    , comunicatorHost = process.env.COMUNICATOR_HOST || '0.0.0.0'
    , comunicatorPort = process.env.COMUNICATOR_PORT || 9876
    , sockets = {}
    , WebSocketServer = ws.Server
    , wss = new WebSocketServer({'host': comunicatorHost, 'port': comunicatorPort}, function comunicatorWebSocketUpAndRunning() {

        /*eslint-disable no-console*/
        console.info('Server listen websocket connections on host - port:', comunicatorHost, '-', comunicatorPort);
        /*eslint-enable no-console*/
      })
    , timeWaitSlice = 9000
    , timeWaitSliceChoices = [0]
    , chosenTimeWaitValue = {}
    , sendPendingRequests = {}
    , giveMeATimeWait = function giveMeATimeWait() {

        return Math.floor(Math.random() * (timeWaitSliceChoices.length + 1));
      }
    , _onTick = function _onTick(redoFunction, who) {

        if (!who) {

          /*eslint-disable no-console*/
          console.error('Mandatory [who] field missing');
          /*eslint-enable no-console*/
        } else {

          var requestId
            , nextTimeWaitSliceChoice;
          if (chosenTimeWaitValue[who] > 0) {

            chosenTimeWaitValue[who] -= 1;
            //window.console.debug('Decreasing chosen time wait value...');
            requestId = setTimeout(_onTick.bind(undefined, redoFunction, who), 0);
            if (!sendPendingRequests[who]) {

              sendPendingRequests[who] = [];
            }
            sendPendingRequests[who].push(requestId);
          } else {

            nextTimeWaitSliceChoice = timeWaitSlice * (Math.pow(2, timeWaitSliceChoices.length) - 1);
            timeWaitSliceChoices.push(nextTimeWaitSliceChoice);
            chosenTimeWaitValue[who] = giveMeATimeWait();
            //window.console.debug('Chosen time wait value:', this.chosenTimeWaitValue);
            redoFunction();
          }
        }
      };

  module.exports = function toExport(jwtSaltKey) {

    var eventEmitter = new EventEmitter()
      , broadcast = function broadcast(whoami, what) {

          if (!whoami &&
            !what) {

            /*eslint-disable no-console*/
            console.error('Mandatory params [whoami] - [what]: ' + whoami + ' - ' + what);
            /*eslint-enable no-console*/
          } else {

            var toSend = {
                'opcode': 'broadcasted',
                'whoami': whoami,
                'what': what
              }
              , whoamiWebSocket = sockets[whoami]
              , socketsKeys = Object.keys(sockets)
              , socketIndex
              , aSocketKey
              , aWebSocket;

            for (socketIndex = 0; socketIndex < socketsKeys.length; socketIndex += 1) {

              aSocketKey = socketsKeys[socketIndex];
              aWebSocket = sockets[aSocketKey];
              if (aWebSocket.readyState === ws.OPEN &&
                whoamiWebSocket !== aWebSocket) {

                aWebSocket.send(JSON.stringify(toSend));
              }
            }
          }
        }
      , sendTo = function sendTo(whoami, who, what) {

          if (!whoami &&
            !who &&
            !what) {

            /*eslint-disable no-console*/
            console.error('Mandatory params [whoami] - [who] - [what]: ' + whoami + ' - ' + who + ' - ' + what);
            /*eslint-enable no-console*/
          } else {

            var toSend = {
                'opcode': 'sent',
                'whoami': whoami,
                'who': who,
                'what': what
              }
              , aWebSocket = sockets[who]
              , requestId
              , onTickBoundedOnSend
              , sendPendingRequestsIndex = 0
              , sendPendingRequestsLegth
              , aSendingPendingRequest;
            if (!!aWebSocket &&
              aWebSocket.readyState === ws.OPEN) {

              aWebSocket.send(JSON.stringify(toSend));
              if (!sendPendingRequests[who]) {

                sendPendingRequests[who] = [];
              }
              sendPendingRequestsLegth = sendPendingRequests[who].length;
              for (sendPendingRequestsIndex = 0; sendPendingRequestsIndex < sendPendingRequestsLegth; sendPendingRequestsIndex += 1) {

                aSendingPendingRequest = sendPendingRequests[who][sendPendingRequestsIndex];
                if (aSendingPendingRequest) {

                  clearTimeout(aSendingPendingRequest);
                } else {

                  /*eslint-disable no-console*/
                  console.warn('A pending send timeout is invalid');
                  /*eslint-enable no-console*/
                }
              }
            } else {

              onTickBoundedOnSend = _onTick.bind(undefined, sendTo.bind(undefined, whoami, who, what), who);
              requestId = setTimeout(onTickBoundedOnSend, 0);
              if (!sendPendingRequests[who]) {

                sendPendingRequests[who] = [];
              }
              sendPendingRequests[who].push(requestId);
            }
          }
        }
      , isUserPresent = function isUserPresent(who) {

          if (!who) {

            return false;
          }
          return sockets[who] !== undefined;
        }
      , manageIncomingMessage = function manageIncomingMessage(message, aWebSocket) {

          var parsedMsg = JSON.parse(message);
          /* {'opcode': 'join', 'whoami': <id>, 'token': <jwt-token>} */
          if (parsedMsg.opcode === 'join') {

            /*eslint-disable no-console*/
            console.log('-- incoming ---', {'opcode': 'join', 'whoami': parsedMsg.whoami});
            /*eslint-enable no-console*/
            jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified(err) {

              if (err) {

                /*eslint-disable no-console*/
                console.error(err);
                /*eslint-enable no-console*/
              } else {

                sockets[parsedMsg.whoami] = aWebSocket;
                var toSend = {
                  'opcode': 'joined',
                  'whoami': parsedMsg.whoami,
                  'token': parsedMsg.token
                };
                aWebSocket.send(JSON.stringify(toSend));
                eventEmitter.emit('comunicator:user-joined', parsedMsg.whoami);
              }
            });
          } else
          /* {'opcode': 'sendTo', 'token': <jwt-token>, 'data': {'whoami': <id>, 'who': <id>, 'what': payload}} */
          if (parsedMsg.opcode === 'sendTo' &&
            parsedMsg.data &&
            parsedMsg.data.who &&
            parsedMsg.data.whoami &&
            parsedMsg.data.what) {

            /*eslint-disable no-console*/
            console.log('-- incoming ---', {'opcode': 'sendTo', 'data': {'whoami': parsedMsg.data.whoami, 'who': parsedMsg.data.who, 'what': parsedMsg.data.what}});
            /*eslint-enable no-console*/
            jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified(err) {

              if (err) {

                /*eslint-disable no-console*/
                console.error(err);
                /*eslint-enable no-console*/
              } else {

                sendTo(parsedMsg.data.whoami, parsedMsg.data.who, parsedMsg.data.what);
              }
            });
          } else
          /* {'whoami': whoami, 'token': <jwt-token>, 'data': {'who': '*', 'what': what}} */
          if (parsedMsg.opcode === 'broadcast' &&
            parsedMsg.data &&
            parsedMsg.data.whoami &&
            parsedMsg.data.what) {

            /*eslint-disable no-console*/
            console.log('-- incoming ---', {'opcode': 'broadcast', 'data': {'whoami': parsedMsg.data.whoami, 'who': '*', 'what': parsedMsg.data.what}});
            /*eslint-enable no-console*/
            jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified(err) {

              if (err) {

                /*eslint-disable no-console*/
                console.error(err);
                /*eslint-enable no-console*/
              } else {

                broadcast(parsedMsg.data.whoami, parsedMsg.data.what);
              }
            });
          } else {

            /*eslint-disable no-console*/
            console.error('Operation not permitted');
            /*eslint-enable no-console*/
          }
        }
      , websocketClosed = function closingWebSocket(aWebSocket) {

          var socketsKeys = Object.keys(sockets)
            , socketIndex
            , aSocketKey;

          for (socketIndex = 0; socketIndex < socketsKeys.length; socketIndex += 1) {

            aSocketKey = socketsKeys[socketIndex];
            if (aWebSocket === sockets[aSocketKey]) {

              eventEmitter.emit('comunicator:user-leave', aSocketKey);
              delete sockets[aSocketKey];
            }
          }
        }
      , onRequest = function onRequestFromWebSocket(socket) {

          socket.on('message', function onMessageFromWebSocket(message) {

            manageIncomingMessage(message, socket);
          });

          socket.on('close', function onCloseEvent() {

            websocketClosed(socket);
          });
        };

    wss.on('connection', onRequest);

    eventEmitter.broadcast = broadcast;
    eventEmitter.sendTo = sendTo;
    eventEmitter.isUserPresent = isUserPresent;

    return eventEmitter;
  };
}(module, require, process, console, setTimeout, clearTimeout));
