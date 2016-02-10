/*global require,module*/
const ws = require('ws')
  , jwt = require('jsonwebtoken')
  , Rx = require('rxjs/Rx')
  , debug = require('debug')('720kb:comunicator:debug')
  , broadcaster = require('./broadcaster')
  , sender = require('./sender')
  , userChecker = require('./user-checker')
  , websocketSym = Symbol('websocket')
  , comunicatorState = {
    'connectedSockets': new Map(),
    'sendPendingRequests': new Map()
  };

class Comunicator extends Rx.Observable {
  constructor(websocketConfigurations, jwtSaltKey) {

    if (!websocketConfigurations ||
       !jwtSaltKey) {

      throw new Error(`Missing mandatory parameters [websocketConfigurations] - [jwtSaltKey]: ${websocketConfigurations} - ${jwtSaltKey}`);
    }

    super(observer => {

      this[websocketSym] = new ws.Server(websocketConfigurations, () => observer.next({
        'type': 'ready'
      }));

      this[websocketSym].on('error', error => observer.error({
        'type': 'error',
        'cause': new Error(error)
      }));

      this[websocketSym].on('connection', socket => {

        observer.next({
          'type': 'open',
          'whoami': socket
        });

        socket.on('close', () => {

          for (const aSocket of comunicatorState.connectedSockets) {

            if (aSocket &&
              aSocket.length === 2 &&
              socket === aSocket[1]) {

              if (isNaN(aSocket[0])) {

                observer.next({
                  'type': 'user-leave',
                  'whoami': aSocket[0]
                });
              } else {

                observer.next({
                  'type': 'user-leave',
                  'whoami': Number(aSocket[0])
                });
              }

              comunicatorState.connectedSockets.delete(aSocket[0]);
            }
          }
        });

        socket.on('error', error => observer.error({
          'type': 'error',
          'cause': new Error(error)
        }));

        socket.on('message', message => {
          const parsedMsg = JSON.parse(message);

          /* {'opcode': 'join', 'whoami': <id>, 'token': <jwt-token>} */
          if (parsedMsg.opcode === 'join') {

            debug(`-- incoming join from ${parsedMsg.whoami}`);
            jwt.verify(parsedMsg.token, jwtSaltKey, err => {

              if (err) {

                observer.error({
                  'type': 'error',
                  'cause': new Error(err)
                });
              } else {

                comunicatorState.connectedSockets.set(parsedMsg.whoami, socket);
                const toSend = {
                    'opcode': 'joined',
                    'whoami': parsedMsg.whoami,
                    'token': parsedMsg.token
                  };

                socket.send(JSON.stringify(toSend));
                observer.next({
                  'type': 'user-joined',
                  'whoami': parsedMsg.whoami
                });
                if (comunicatorState.sendPendingRequests.has(parsedMsg.whoami)) {

                  for (const aSendPendingRequest of comunicatorState.sendPendingRequests.get(parsedMsg.whoami)) {
                    if (aSendPendingRequest &&
                      aSendPendingRequest.whoami &&
                      aSendPendingRequest.who &&
                      aSendPendingRequest.what) {

                      this.sendTo(aSendPendingRequest.whoami, aSendPendingRequest.who, aSendPendingRequest.what);
                    } else {

                      observer.error({
                        'type': 'warning',
                        'cause': new Error('A sending pending request is invalid.')
                      });
                    }
                  }

                  comunicatorState.sendPendingRequests.delete(parsedMsg.whoami);
                } else {

                  observer.next({
                    'type': 'no-pending-messages',
                    'whoami': parsedMsg.whoami
                  });
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
            debug(`-- incoming sent message from ${parsedMsg.data.whoami} to ${parsedMsg.data.who}`);
            /*eslint-enable no-console*/
            jwt.verify(parsedMsg.token, jwtSaltKey, err => {

              if (err) {

                observer.error({
                  'type': 'error',
                  'cause': new Error(err)
                });
              } else {

                observer.next({
                  'type': 'message-arrived',
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

            debug(`-- incoming broadcast message from ${parsedMsg.data.whoami}`);
            jwt.verify(parsedMsg.token, jwtSaltKey, err => {

              if (err) {

                observer.error({
                  'type': 'error',
                  'cause': new Error(err)
                });
              } else {

                observer.next({
                  'type': 'message-arrived',
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

            observer.error({
              'type': 'warning',
              'cause': new Error(`operation not permitted: ${JSON.stringify(parsedMsg)}`)
            });
          }
        });
      });
    });
  }

  close() {

    this[websocketSym].close();
  }
}

Object.assign(
  Comunicator.prototype,
  broadcaster(comunicatorState),
  sender(comunicatorState),
  userChecker(comunicatorState)
);

module.exports = Comunicator;
