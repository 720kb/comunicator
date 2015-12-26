/*global require,module,process,console*/
const ws = require('ws')
  , jwt = require('jsonwebtoken')
  , sockets = {}
  , sendPendingRequests = {};

class Comunicator extends ws.Server {

  constructor(host, port, jwtSaltKey) {

    host = host || process.env.COMUNICATOR_HOST || '0.0.0.0';
    port = port || process.env.COMUNICATOR_PORT || 9876;
    super({
      'host': host,
      'port': port
    }, function comunicatorWebSocketUpAndRunning() {

      /*eslint-disable no-console*/
      console.info('Server listen websocket connections on host - port:', host, '-', port);
      /*eslint-enable no-console*/
    });

    const websocketClosed = function websocketClosed(aWebSocket) {
      var socketsKeys = Object.keys(sockets)
        , socketIndex
        , aSocketKey;

      for (socketIndex = 0; socketIndex < socketsKeys.length; socketIndex += 1) {

        aSocketKey = socketsKeys[socketIndex];
        if (aWebSocket === sockets[aSocketKey]) {

          if (isNaN(aSocketKey)) {

            this.emit('comunicator:user-leave', aSocketKey);
          } else {

            this.emit('comunicator:user-leave', Number(aSocketKey));
          }
          delete sockets[aSocketKey];
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

            sockets[parsedMsg.whoami] = aWebSocket;
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

      this.on('message', function onMessageFromWebSocket(message) {

        manageIncomingMessage(message, socket);
      });

      this.on('close', function onCloseEvent() {

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
        , aWebSocket = sockets[who];

      if (!!aWebSocket &&
        aWebSocket.readyState === ws.OPEN) {

        aWebSocket.send(JSON.stringify(toSend));
      } else {

        if (!sendPendingRequests[who]) {

          sendPendingRequests[who] = [];
        }
        sendPendingRequests[who].push(this.sendTo.bind(undefined, whoami, who, what));
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
    return sockets[who] !== undefined;
  }
}

module.exports = Comunicator;
