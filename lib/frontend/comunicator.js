/*global window*/
import Rx from 'rxjs/Rx';
import {WebSocket} from 'ws';
import broadcaster from './lib/broadcaster';
import sender, {sendMessageFactory} from './lib/sender';
import userManagement from './lib/user-management';

const comunicatorState = {
  'whoReallyAmI': undefined,
  'reallyToken': undefined,
  'websocket': undefined,
  'queue': []
};
let WebSocketCtor;

try {

  WebSocketCtor = WebSocket;
  if (!WebSocketCtor) {

    WebSocketCtor = window.WebSocket;
  }
} catch (err) {

  WebSocketCtor = window.WebSocket;
}

class Comunicator extends Rx.Observable {
  constructor(websocketUrl) {

    super(observer => {

      if (websocketUrl) {

        if (typeof websocketUrl === 'string') {

          comunicatorState.websocket = new WebSocketCtor(websocketUrl);
        } else if (typeof websocketUrl === 'object' &&
          websocketUrl instanceof WebSocketCtor) {

          comunicatorState.websocket = websocketUrl;
        } else {

          observer.error({
            'type': 'error',
            'cause': 'websocket parameter passed is neither a string nor a WebSocket object'
          });
        }

        observer.next({
          'type': 'ready'
        });

        comunicatorState.websocket.onopen = openEvent => {

          observer.next({
            'type': 'open',
            'whoami': openEvent.target
          });

          while (comunicatorState.queue.length > 0 &&
            comunicatorState.websocket.readyState === WebSocketCtor.OPEN) {

            comunicatorState.websocket.push(comunicatorState.queue.shift());
          }
        };

        comunicatorState.websocket.onmessage = event => {
          const parsedMsg = window.JSON.parse(event.data);

          if (parsedMsg.opcode === 'joined') {

            observer.next({
              'type': 'joined',
              'value': parsedMsg
            });
          } else if (parsedMsg.opcode === 'sent') {

            observer.next({
              'type': 'to-me',
              'value': parsedMsg
            });
          } else if (parsedMsg.opcode === 'broadcasted') {

            observer.next({
              'type': 'to-all',
              'value': parsedMsg
            });
          }
        };
        comunicatorState.websocket.onclose = () => {

          if (comunicatorState.whoReallyAmI &&
            comunicatorState.reallyToken) {

            observer.next({
              'type': 'closed'
            });
            observer.complete();
          }
        };

        comunicatorState.websocket.push = comunicatorState.websocket.send;
        comunicatorState.websocket.send = sendMessageFactory(comunicatorState);
      } else {

        observer.error({
          'type': 'error',
          'cause': 'Please provide a valid URL.'
        });
      }
    });
  }
}

Object.assign(
  Comunicator.prototype,
  broadcaster(comunicatorState),
  sender(comunicatorState),
  userManagement(comunicatorState)
);

export default Comunicator;
