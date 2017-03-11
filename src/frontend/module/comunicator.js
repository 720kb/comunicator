/*global window*/
import {Observable} from '@reactivex/rxjs';
import WebSocket from 'ws';

import user from './user/user-is-present';
import sendTo from './action/send-to';
import broadcast from './action/broadcast';

let WebSocketCtor;

try {

  WebSocketCtor = WebSocket;
  if (!WebSocketCtor) {

    WebSocketCtor = window.WebSocket;
  }
} catch (err) {

  WebSocketCtor = window.WebSocket;
}

const stateSym = Symbol('state')
  , timeWaitSlice = 9000
  , timeWaitSliceChoices = [0]
  , websocketUrlMandatory = () => {
    throw new Error('Missing mandatory websocketUrl parameter.');
  }
  , giveMeATimeWait = () => {

    return Math.floor(Math.random() * (timeWaitSliceChoices.length + 1));
  };

class Comunicator extends Observable {
  constructor(websocketUrl = websocketUrlMandatory()) {
    const comunicatorState = {
      'queue': []
      }
      , internalObservable = new Observable(subscriber => {
        let inError = false;

        if (comunicatorState.websocket &&
          (comunicatorState.websocket.readyState !== WebSocketCtor.CONNECTING ||
          comunicatorState.websocket.readyState !== WebSocketCtor.OPEN)) {

          inError = true;
        }

        if (typeof websocketUrl === 'string') {

          comunicatorState.websocket = new WebSocketCtor(websocketUrl);
        } else if (typeof websocketUrl === 'object' &&
          websocketUrl instanceof WebSocketCtor) {

          comunicatorState.websocket = websocketUrl;
        } else {

          throw new Error('websocket parameter passed is neither a string nor a WebSocket object');
        }

        comunicatorState.websocket.onopen = event => {

          subscriber.next({
            'type': 'open',
            'whoami': event.target
          });

          while (comunicatorState.queue.length > 0 &&
            comunicatorState.websocket.readyState === WebSocketCtor.OPEN) {

            comunicatorState.websocket.push(comunicatorState.queue.shift());
          }
        };

        comunicatorState.websocket.onmessage = event => {
          const parsedMsg = JSON.parse(event.data);

          if (parsedMsg.opcode === 'joined') {

            if (parsedMsg.whoami === comunicatorState.whoReallyAmI) {

              Object.assign(Comunicator.prototype,
                sendTo(comunicatorState),
                broadcast(comunicatorState));
            }
            subscriber.next({
              'type': 'joined',
              'whoami': parsedMsg.whoami
            });
          } else if (parsedMsg.opcode === 'to-me') {

            subscriber.next({
              'type': 'to-me',
              'whoami': parsedMsg.whoami,
              'who': parsedMsg.who,
              'what': parsedMsg.what
            });
          } else if (parsedMsg.opcode === 'to-all') {

            subscriber.next({
              'type': 'to-all',
              'whoami': parsedMsg.whoami,
              'what': parsedMsg.what
            });
          }
        };

        comunicatorState.websocket.onerror = error => {

          subscriber.error({
            'type': 'error',
            'cause': error
          });
        };

        comunicatorState.websocket.onclose = () => {

          subscriber.error({
            'type': 'closed'
          });
        };

        comunicatorState.websocket.push = comunicatorState.websocket.send;
        comunicatorState.websocket.send = (opcode, data) => {
          const messageToSend = JSON.stringify({
            opcode,
            'token': comunicatorState.reallyToken,
            data
          });

          if (comunicatorState.websocket &&
            comunicatorState.websocket.readyState === WebSocketCtor.OPEN) {

            comunicatorState.websocket.push(messageToSend);
          } else {

            comunicatorState.queue.push(messageToSend);
          }
        };

        if (inError &&
          comunicatorState.websocket.readyState !== WebSocketCtor.CONNECTING &&
          comunicatorState.websocket.readyState !== WebSocketCtor.OPEN) {

          subscriber.error({
            'type': 'closed'
          });
        }

        Object.assign(Comunicator.prototype, user(comunicatorState));
        return () => {

          comunicatorState.websocket.close();
        };
      }).share();

    super(observer => {

      const subscriptionToInternalObservable = internalObservable
        .retryWhen(errors => errors.switchMap(() => {
          const nextTimeWaitSliceChoice = timeWaitSlice * (Math.pow(2, timeWaitSliceChoices.length) - 1);

          timeWaitSliceChoices.push(nextTimeWaitSliceChoice);
          return Observable.timer(timeWaitSliceChoices[giveMeATimeWait()]);
        }))
        .subscribe(observer);

      return () => {

        subscriptionToInternalObservable.unsubscribe();
      };
    });
    this[stateSym] = comunicatorState;
  }

  get whoAmI() {

    return this[stateSym].whoReallyAmI;
  }
}

export {Comunicator};
