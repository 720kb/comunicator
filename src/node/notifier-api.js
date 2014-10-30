/*global module require process console*/
(function (module, require, process, console) {
  'use strict';

  var sockets = {}
    , ws = require('ws')
    , jwt = require('jsonwebtoken')
    , config = require('../config')
    , EventEmitter = require('events').EventEmitter
    , events = new EventEmitter()
    , WebSocketServer = ws.Server
    , wss = new WebSocketServer({'port': process.env.NOTIFER_PORT}, function () {

        console.info('Server listen websocket connections on port', process.env.NOTIFER_PORT);
      })
    , broadcast = function (whoami, what) {

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
    , sendTo = function (whoami, who, what) {

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

          console.error('No user', who, 'is connected to notifier');
        }
      }
    , manageIncomingMessage = function (message, aWebSocket) {

        var parsedMsg = JSON.parse(message);

        /* {'opcode': 'join', 'whoami': <id>, 'token': <jwt-token>} */
        if (parsedMsg.opcode === 'join') {

          jwt.verify(parsedMsg.token, config.sessionSecretKey, function () {

            sockets[parsedMsg.whoami] = aWebSocket;

            var toSend = {
              'opcode': 'joined',
              'whoami': parsedMsg.whoami,
              'token': parsedMsg.token
            };

            aWebSocket.send(JSON.stringify(toSend));
          });
        } else
        /* {'opcode': 'sendTo', 'token': <jwt-token>, 'data': {'whoami': <id>, 'who': <id>, 'what': payload}} */
        if (parsedMsg.opcode === 'sendTo' &&
          !!parsedMsg.data &&
          !!parsedMsg.data.who &&
          !!parsedMsg.data.whoami &&
          !!parsedMsg.data.what) {

          jwt.verify(parsedMsg.token, config.sessionSecretKey, function () {

            sendTo(parsedMsg.data.whoami, parsedMsg.data.who, parsedMsg.data.what);
          });
        } else
        /* {'whoami': whoami, 'token': <jwt-token>, 'data': {'who': '*', 'what': what}} */
        if (parsedMsg.opcode === 'broadcast' &&
          !!parsedMsg.data &&
          !!parsedMsg.data.whoami &&
          !!parsedMsg.data.what) {

          jwt.verify(parsedMsg.token, config.sessionSecretKey, function () {

            broadcast(parsedMsg.data.whoami, parsedMsg.data.what);
          });
        }
      }
    , websocketClosed = function (aWebSocket) {

        var socketsKeys = Object.keys(sockets)
          , socketIndex
          , aSocketKey;

        for (socketIndex = 0; socketIndex < socketsKeys.length; socketIndex += 1) {

          aSocketKey = socketsKeys[socketIndex];

          if (aWebSocket === sockets[aSocketKey]) {

            //emit socket is going to close
            events.emit('closingSocket', aSocketKey);

            delete sockets[aSocketKey];
          }
        }
      }
    , onRequest = function (socket) {

        socket.on('message', function (message) {

          console.log('A message -----------');
          console.log(message);
          console.log('----------------------------------' + Math.random(999,28728722));
          manageIncomingMessage(message, socket);
        });

        socket.on('close', function () {

          websocketClosed(socket);
        });
      };

    wss.on('connection', onRequest);

    module.exports = {
      'wss': wss,
      'events':events,
      'sockets': sockets,
      'broadcast': broadcast,
      'sendTo': sendTo
    };
}(module, require, process, console));
