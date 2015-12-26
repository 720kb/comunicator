/*global require,module,process,console*/
(function withNode(require, module, process, console) {
  'use strict';

  const ws = require('ws')
    , jwt = require('jsonwebtoken')
    , connectedSockets = new Map()
    , sendPendingRequests = {};

  class Comunicator extends ws.Server {

    constructor(host, port, jwtSaltKey) {

      if (arguments.length === 1) {

        jwtSaltKey = host;
        host = undefined;
        port = undefined;
      }

      host = host || process.env.COMUNICATOR_HOST || '0.0.0.0';
      port = port || process.env.COMUNICATOR_PORT || 9876;
      super({
        'host': host,
        'port': port
      }, () => {

        this.emit('comunicator:ready', {
          'host': host,
          'port': port
        });
      });

      const websocketClosed = function websocketClosed(aWebSocket) {

        for (let aSocket of connectedSockets) {

          if (aSocket &&
            aSocket.length === 2 &&
            aWebSocket === aSocket[1]) {

            if (isNaN(aSocket[0])) {

              this.emit('comunicator:user-leave', aSocket[0]);
            } else {

              this.emit('comunicator:user-leave', Number(aSocket[0]));
            }
            connectedSockets.delete(aSocket[0]);
          }
        }
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
          jwt.verify(parsedMsg.token, jwtSaltKey, (err) => {

            if (err) {

              /*eslint-disable no-console*/
              console.error(err);
              /*eslint-enable no-console*/
            } else {

              connectedSockets.set(parsedMsg.whoami, aWebSocket);
              var toSend = {
                  'opcode': 'joined',
                  'whoami': parsedMsg.whoami,
                  'token': parsedMsg.token
                }
                , sendPendingRequestsIndex = 0
                , sendPendingRequestsLength
                , aSendPendingRequest;

              aWebSocket.send(JSON.stringify(toSend));
              this.emit('comunicator:user-joined', parsedMsg.whoami);
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
          jwt.verify(parsedMsg.token, jwtSaltKey, (err) => {

            if (err) {

              /*eslint-disable no-console*/
              console.error(err);
              /*eslint-enable no-console*/
            } else {

              this.emit('comunicator:message-arrived', {
                'whoami': parsedMsg.data.whoami,
                'who': parsedMsg.data.who,
                'what': parsedMsg.data.what
              });

              if (!parsedMsg.data.managed) {

                this.sendTo(parsedMsg.data.whoami, parsedMsg.data.who, parsedMsg.data.what);
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
          jwt.verify(parsedMsg.token, jwtSaltKey, (err) => {

            if (err) {

              /*eslint-disable no-console*/
              console.error(err);
              /*eslint-enable no-console*/
            } else {

              this.emit('comunicator:message-arrived', {
                'whoami': parsedMsg.data.whoami,
                'who': '*',
                'what': parsedMsg.data.what
              });

              if (!parsedMsg.data.managed) {

                this.broadcast(parsedMsg.data.whoami, parsedMsg.data.what);
              }
            }
          });
        } else {

          /*eslint-disable no-console*/
          console.error('Operation not permitted');
          /*eslint-enable no-console*/
        }
      };

      this.on('connection', (socket) => {

        this.on('message', (message) => {

          manageIncomingMessage(message, socket);
        });

        this.on('close', () => {

          websocketClosed(socket);
        });
      });
    }

    broadcast(whoami, what) {

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
          , whoamiWebSocket = connectedSockets.get(whoami);

        for (let aSocket of connectedSockets) {

          if (aSocket &&
            aSocket.length === 2 &&
            aSocket[1] !== whoamiWebSocket &&
            aSocket[1].readyState === ws.OPEN) {

            aSocket[1].send(JSON.stringify(toSend));
          }
        }
      }
    }

    sendTo(whoami, who, what) {

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
          , aWebSocket = connectedSockets.get(who);

        if (!!aWebSocket &&
          aWebSocket.readyState === ws.OPEN) {

          aWebSocket.send(JSON.stringify(toSend));
        } else {

          if (!sendPendingRequests[who]) {

            sendPendingRequests[who] = [];
          }
          sendPendingRequests[who].push(this.sendTo.bind(this, whoami, who, what));
          /*eslint-disable no-console*/
          console.error('User', who, ' isn\'t here at the moment...');
          /*eslint-enable no-console*/
        }
      }
    }

    isUserPresent(who) {

      if (!who) {

        return false;
      }
      return connectedSockets.has(who);
    }
  }

  module.exports = Comunicator;
}(require, module, process, console));
