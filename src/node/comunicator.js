import ws from 'ws';
import jwt from 'jsonwebtoken';
import {Observable} from '@reactivex/rxjs';
import debug from 'debug';

import user from './user';
import sendTo from './action/send-to';
import broadcast from './action/broadcast';
import hapiPlugin from './hapi/plugin';

import packageJSON from '../../package.json';

const log = debug('720kb:comunicator:debug')
  , websocketConfigurationsMandatory = () => {
    throw new Error('Missing mandatory parameter websocketConfigurations.');
  }
  , jwtSaltKeyMandatory = () => {
    throw new Error('Missing mandatory parameter jwtSaltKey.');
  };

class Comunicator extends Observable {
  constructor(websocketConfigurations = websocketConfigurationsMandatory(), jwtSaltKey = jwtSaltKeyMandatory()) {

    const comunicatorState = {
        'connectedSockets': new Map(),
        'sendPendingRequests': new Map()
      }
      , internalObservable = new Observable(subscriber => {

        const socketServer = new ws.Server(websocketConfigurations, () => subscriber.next({
          'type': 'ready'
        }));

        socketServer.on('error', err => subscriber.error({
          'type': 'error',
          'cause': err
        }));

        socketServer.on('connection', socket => {

          subscriber.next({
            'type': 'open',
            'whoami': socket
          });

          socket.on('close', () => {

            for (const aSocket of comunicatorState.connectedSockets) {

              if (aSocket &&
                aSocket.length === 2 &&
                socket === aSocket[1]) {

                if (isNaN(aSocket[0])) {

                  subscriber.next({
                    'type': 'user-leave',
                    'whoami': aSocket[0]
                  });
                } else {

                  subscriber.next({
                    'type': 'user-leave',
                    'whoami': Number(aSocket[0])
                  });
                }

                comunicatorState.connectedSockets.delete(aSocket[0]);
              }
            }
          });

          socket.on('error', err => subscriber.error({
            'type': 'error',
            'cause': err
          }));

          socket.on('message', message => {
            const parsedMsg = JSON.parse(message);

            /* {'opcode': 'join', 'whoami': <id>, 'token': <jwt-token>} */
            if (parsedMsg.opcode === 'join') {

              log(`-- incoming join from ${parsedMsg.whoami}`);
              jwt.verify(parsedMsg.token, jwtSaltKey, err => {

                if (err) {

                  subscriber.error({
                    'type': 'error',
                    'cause': err
                  });
                } else {

                  comunicatorState.connectedSockets.set(parsedMsg.whoami, socket);
                  const toSend = {
                      'opcode': 'joined',
                      'whoami': parsedMsg.whoami,
                      'token': parsedMsg.token
                    };

                  socket.send(JSON.stringify(toSend));
                  subscriber.next({
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

                        subscriber.error({
                          'type': 'warning',
                          'cause': 'A sending pending request is invalid.'
                        });
                      }
                    }

                    comunicatorState.sendPendingRequests.delete(parsedMsg.whoami);
                  } else {

                    subscriber.next({
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
              log(`-- incoming sent message from ${parsedMsg.data.whoami} to ${parsedMsg.data.who}`);
              /*eslint-enable no-console*/
              jwt.verify(parsedMsg.token, jwtSaltKey, err => {

                if (err) {

                  subscriber.error({
                    'type': 'error',
                    'cause': err
                  });
                } else {

                  subscriber.next({
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

              log(`-- incoming broadcast message from ${parsedMsg.data.whoami}`);
              jwt.verify(parsedMsg.token, jwtSaltKey, err => {

                if (err) {

                  subscriber.error({
                    'type': 'error',
                    'cause': err
                  });
                } else {

                  subscriber.next({
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

              subscriber.error({
                'type': 'warning',
                'cause': `operation not permitted: ${JSON.stringify(parsedMsg)}`
              });
            }
          });
        });

        return () => {

          socketServer.close();
        };
      }).share();

    super(observer => {

      const subscriptionToInternalObservable = internalObservable
        .subscribe(observer);

      return () => {

        subscriptionToInternalObservable.unsubscribe();
      };
    });

    Object.assign(Comunicator.prototype,
      user(comunicatorState),
      sendTo(comunicatorState),
      broadcast(comunicatorState));
  }
}

/*eslint-disable one-var*/
const hapiComunicator = hapiPlugin(packageJSON, Comunicator);
/*eslint-enable*/

export {Comunicator as default, hapiComunicator};
