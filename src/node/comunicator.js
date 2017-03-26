import ws from 'ws';
import {Observable} from '@reactivex/rxjs';
import debug from 'debug';

import user from './user';
import sendTo from './action/send-to';
import broadcast from './action/broadcast';
import hapiPlugin from './hapi/plugin';

import joinReaction from './reactions/join';
import sendToReaction from './reactions/send-to';
import broadcastReaction from './reactions/broadcast';

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
        'sendPendingRequests': new Map(),
        jwtSaltKey
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

            switch (parsedMsg.opcode) {
              case 'join': {

                /* {'opcode': 'join', 'whoami': <id>, 'token': <jwt-token>} */
                joinReaction(parsedMsg);
                break;
              }
              case 'sendTo': {

                /* {'opcode': 'sendTo', 'token': <jwt-token>, 'data': {'whoami': <id>, 'who': <id>, 'what': payload}} */
                sendToReaction(parsedMsg);
                break;
              }
              case 'broadcast': {

                /* {'whoami': whoami, 'token': <jwt-token>, 'data': {'who': '*', 'what': what}} */
                broadcastReaction(parsedMsg);
                break;
              }
              default: {

                subscriber.error({
                  'type': 'warning',
                  'cause': `operation not permitted: ${JSON.stringify(parsedMsg)}`
                });
              }
            }

            if (parsedMsg.opcode === 'join') {}
            else if (parsedMsg.opcode === 'sendTo' &&
              parsedMsg.data &&
              parsedMsg.data.who &&
              parsedMsg.data.whoami &&
              parsedMsg.data.what) {} else

            if (parsedMsg.opcode === 'broadcast' &&
              parsedMsg.data &&
              parsedMsg.data.whoami &&
              parsedMsg.data.what) {} else {}
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
