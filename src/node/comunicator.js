/*global module require process console*/
(function moduleExport(module, require, process, console) {

  'use strict';
  var ws = require('ws')
    , jwt = require('jsonwebtoken')
    , EventEmitter = require('events').EventEmitter
    , notifierHost = process.env.COMUNICATOR_HOST || '0.0.0.0'
    , notifierPort = process.env.COMUNICATOR_PORT || 9876
    , sockets = {}
    , WebSocketServer = ws.Server
    , wss = new WebSocketServer({'host': notifierHost, 'port': notifierPort}, function notifierWebSocketUpAndRunning() {

        /*eslint-disable no-console*/
        console.info('Server listen websocket connections on host - port:', notifierHost, '-', notifierPort);
        /*eslint-enable no-console*/
      });

  module.exports = function toExport(jwtSaltKey) {
    var eventEmitter = new EventEmitter()
      , broadcast = function broadcast(whoami, what) {

          var toSend = {
              'opcode': 'broadcasted',
              'whoami': whoami,
              'what': what
            }
            , socketsKeys = Object.keys(sockets)
            , socketIndex
            , aSocketKey
            , aWebSocket;

          for (socketIndex = 0; socketIndex < socketsKeys.length; socketIndex += 1) {

            aSocketKey = socketsKeys[socketIndex];
            aWebSocket = sockets[aSocketKey];
            if (aWebSocket.readyState === ws.OPEN) {

              aWebSocket.send(JSON.stringify(toSend));
            }
          }
        }
      , sendTo = function sendTo(whoami, who, what) {

          var toSend = {
              'opcode': 'sent',
              'whoami': whoami,
              'who': who,
              'what': what
            }
            , aWebSocket = sockets[who];
          if (!!aWebSocket &&
            aWebSocket.readyState === ws.OPEN) {

            aWebSocket.send(JSON.stringify(toSend));
          } else {

            /*eslint-disable no-console*/
            console.error('No user', who, 'is connected to notifier');
            /*eslint-enable no-console*/
          }
        }
      , isUserPresent = function isUserPresent(who) {

          return sockets[who] !== undefined;
        }
      , manageIncomingMessage = function manageIncomingMessage(message, aWebSocket) {

          var parsedMsg = JSON.parse(message);
          /*eslint-disable no-console*/
          console.log('-- comunicator incoming ---', parsedMsg);
          /*eslint-enable no-console*/

          /* {'opcode': 'join', 'whoami': <id>, 'token': <jwt-token>} */
          if (parsedMsg.opcode === 'join') {

            jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified() {

              sockets[parsedMsg.whoami] = aWebSocket;
              var toSend = {
                'opcode': 'joined',
                'whoami': parsedMsg.whoami,
                'token': parsedMsg.token
              };
              aWebSocket.send(JSON.stringify(toSend));
              eventEmitter.emit('notifier:userJoin', parsedMsg.whoami);
            });
          } else
          /* {'opcode': 'sendTo', 'token': <jwt-token>, 'data': {'whoami': <id>, 'who': <id>, 'what': payload}} */
          if (parsedMsg.opcode === 'sendTo' &&
            parsedMsg.data &&
            parsedMsg.data.who &&
            parsedMsg.data.whoami &&
            parsedMsg.data.what) {

            jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified(err) {

              if (err) {
                throw err;
              }
              sendTo(parsedMsg.data.whoami, parsedMsg.data.who, parsedMsg.data.what);
            });
          } else
          /* {'whoami': whoami, 'token': <jwt-token>, 'data': {'who': '*', 'what': what}} */
          if (parsedMsg.opcode === 'broadcast' &&
            parsedMsg.data &&
            parsedMsg.data.whoami &&
            parsedMsg.data.what) {

            jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified(err) {

              if (err) {
                throw err;
              }
              broadcast(parsedMsg.data.whoami, parsedMsg.data.what);
            });
          } else {
            /*eslint-disable no-console*/
            console.log('Operation not permitted');
            /*eslint-disable no-console*/
          }
        }
      , websocketClosed = function closingWebSocket(aWebSocket) {

          var socketsKeys = Object.keys(sockets)
            , socketIndex
            , aSocketKey;

          for (socketIndex = 0; socketIndex < socketsKeys.length; socketIndex += 1) {

            aSocketKey = socketsKeys[socketIndex];
            if (aWebSocket === sockets[aSocketKey]) {

              eventEmitter.emit('notifier:userLeave', aSocketKey);
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
}(module, require, process, console));
