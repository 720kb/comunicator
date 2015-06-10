/*global module require process console*/
(function moduleExport(module, require, process, console) {
  'use strict';

  var ws = require('ws')
    , jwt = require('jsonwebtoken')
    , EventEmitter = require('events').EventEmitter
    , comunicatorHost = process.env.COMUNICATOR_HOST || '0.0.0.0'
    , comunicatorPort = process.env.COMUNICATOR_PORT || 9876
    , sockets = {}
    , WebSocketServer = ws.Server
    , wss = new WebSocketServer({
        'host': comunicatorHost,
        'port': comunicatorPort
      }, function comunicatorWebSocketUpAndRunning() {

        /*eslint-disable no-console*/
        console.info('Server listen websocket connections on host - port:', comunicatorHost, '-', comunicatorPort);
        /*eslint-enable no-console*/
      })
    , sendPendingRequests = {}
    , isManaged;

  module.exports = function toExport(jwtSaltKey) {

    var eventEmitter = new EventEmitter()
      , broadcast = function broadcast(whoami, what) {

        if (!whoami &&
          !what) {

          /*eslint-disable no-console*/
          console.error('Mandatory params [whoami] - [what]:', whoami, '-', what);
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
          console.error('Mandatory params [whoami] - [who] - [what]:', whoami, '-', who, '-', what);
          /*eslint-enable no-console*/
        } else {

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

            if (!sendPendingRequests[who]) {

              sendPendingRequests[who] = [];
            }
            sendPendingRequests[who].push(sendTo.bind(undefined, whoami, who, what));
            /*eslint-disable no-console*/
            console.error('User', who, ' isn\'t here at the moment...');
            /*eslint-enable no-console*/
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
          console.log('-- incoming ---', {
            'opcode': 'join',
            'whoami': parsedMsg.whoami
          });
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
                }
                , sendPendingRequestsIndex = 0
                , sendPendingRequestsLength
                , aSendPendingRequest;

              if (parsedMsg.managed) {

                isManaged = parsedMsg.managed;
              }

              aWebSocket.send(JSON.stringify(toSend));
              eventEmitter.emit('comunicator:user-joined', parsedMsg.whoami);
              if (sendPendingRequests[parsedMsg.whoami]) {

                sendPendingRequestsLength = sendPendingRequests[parsedMsg.whoami].length;
                for (sendPendingRequestsIndex = 0; sendPendingRequestsIndex < sendPendingRequestsLength; sendPendingRequestsIndex += 1) {

                  aSendPendingRequest = sendPendingRequests[parsedMsg.whoami][sendPendingRequestsIndex];
                  if (aSendPendingRequest) {

                    aSendPendingRequest();
                  } else {

                    /*eslint-disable no-console*/
                    console.warn('A sending pending request is invalid.');
                    /*eslint-enable no-console*/
                  }
                }
                sendPendingRequests[parsedMsg.whoami] = [];
                delete sendPendingRequests[parsedMsg.whoami];
              } else {

                /*eslint-disable no-console*/
                console.info('No pending requests for', parsedMsg.whoami, 'user.');
                /*eslint-enable no-console*/
              }
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
          console.log('-- incoming ---', {
            'opcode': 'sendTo',
            'data': {
              'whoami': parsedMsg.data.whoami,
              'who': parsedMsg.data.who,
              'what': parsedMsg.data.what
            }
          });
          /*eslint-enable no-console*/
          jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified(err) {

            if (err) {

              /*eslint-disable no-console*/
              console.error(err);
              /*eslint-enable no-console*/
            } else {

              eventEmitter.emit('comunicator:message-arrived', {
                'whoami': parsedMsg.data.whoami,
                'who': parsedMsg.data.who,
                'what': parsedMsg.data.what
              });

              if (!isManaged) {

                sendTo(parsedMsg.data.whoami, parsedMsg.data.who, parsedMsg.data.what);
              }
            }
          });
        } else
        /* {'whoami': whoami, 'token': <jwt-token>, 'data': {'who': '*', 'what': what}} */
        if (parsedMsg.opcode === 'broadcast' &&
          parsedMsg.data &&
          parsedMsg.data.whoami &&
          parsedMsg.data.what) {

          /*eslint-disable no-console*/
          console.log('-- incoming ---', {
            'opcode': 'broadcast',
            'data': {
              'whoami': parsedMsg.data.whoami,
              'who': '*',
              'what': parsedMsg.data.what
            }
          });
          /*eslint-enable no-console*/
          jwt.verify(parsedMsg.token, jwtSaltKey, function userVerified(err) {

            if (err) {

              /*eslint-disable no-console*/
              console.error(err);
              /*eslint-enable no-console*/
            } else {

              eventEmitter.emit('comunicator:message-arrived', {
                'whoami': parsedMsg.data.whoami,
                'who': '*',
                'what': parsedMsg.data.what
              });

              if (!isManaged) {

                broadcast(parsedMsg.data.whoami, parsedMsg.data.what);
              }
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

            if (isNaN(aSocketKey)) {

              eventEmitter.emit('comunicator:user-leave', aSocketKey);
            } else {

              eventEmitter.emit('comunicator:user-leave', Number(aSocketKey));
            }
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
