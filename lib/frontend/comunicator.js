/*global window*/
import Rx from 'rxjs/Rx';
import WebSocket from 'ws';
let WebSocketCtor;

try {

  WebSocketCtor = WebSocket;
  if (!WebSocketCtor) {

    WebSocketCtor = window.WebSocket;
  }
} catch (err) {

  WebSocketCtor = window.WebSocket;
}

const whoReallyAmISym = Symbol('whoReallyAmI')
  , reallyTokenSym = Symbol('reallyToken')
  , websocketSym = Symbol('websocket')
  , queueSym = Symbol('queue')
  , timeWaitSlice = 9000
  , timeWaitSliceChoices = [0]
  , giveMeATimeWait = () => {

    return Math.floor(Math.random() * (timeWaitSliceChoices.length + 1));
  };

class Comunicator extends Rx.Observable {
  constructor(websocketUrl) {
    if (!websocketUrl) {

      throw new Error(`Mandatory parameter is missing: [websocketUrl] ${websocketUrl}`);
    }

    const internalObservable = new Rx.Observable(subscriber => {
      let inError = false;

      if (this[websocketSym] &&
        (this[websocketSym].readyState !== WebSocketCtor.CONNECTING ||
        this[websocketSym].readyState !== WebSocketCtor.OPEN)) {

        inError = true;
      }

      if (typeof websocketUrl === 'string') {

        this[websocketSym] = new WebSocketCtor(websocketUrl);
      } else if (typeof websocketUrl === 'object' &&
        websocketUrl instanceof WebSocketCtor) {

        this[websocketSym] = websocketUrl;
      } else {

        throw new Error('websocket parameter passed is neither a string nor a WebSocket object');
      }

      this[websocketSym].onopen = event => {

        subscriber.next({
          'type': 'open',
          'whoami': event.target
        });

        while (this[queueSym].length > 0 &&
          this[websocketSym].readyState === WebSocketCtor.OPEN) {

          this[websocketSym].push(this[queueSym].shift());
        }
      };

      this[websocketSym].onmessage = event => {
        const parsedMsg = JSON.parse(event.data);

        if (parsedMsg.opcode === 'joined') {

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

      this[websocketSym].onerror = error => {

        subscriber.error({
          'type': 'error',
          'cause': error
        });
      };

      this[websocketSym].onclose = () => {

        subscriber.error({
          'type': 'closed'
        });
      };

      this[websocketSym].push = this[websocketSym].send;
      this[websocketSym].send = (opcode, data) => {
        const messageToSend = JSON.stringify({
          opcode,
          'token': this[reallyTokenSym],
          data
        });

        if (this[websocketSym] &&
          this[websocketSym].readyState === WebSocketCtor.OPEN) {

          this[websocketSym].push(messageToSend);
        } else {

          this[queueSym].push(messageToSend);
        }
      };

      if (inError &&
        this[websocketSym].readyState !== WebSocketCtor.CONNECTING &&
        this[websocketSym].readyState !== WebSocketCtor.OPEN) {

        subscriber.error({
          'type': 'closed'
        });
      }

      return () => {

        this[websocketSym].close();
      };
    }).share();

    super(observer => {

      const subscriptionToInternalObservable = internalObservable
        .retryWhen(errors => errors.switchMap(() => {
          const nextTimeWaitSliceChoice = timeWaitSlice * (Math.pow(2, timeWaitSliceChoices.length) - 1);

          timeWaitSliceChoices.push(nextTimeWaitSliceChoice);
          return Rx.Observable.timer(timeWaitSliceChoices[giveMeATimeWait()]);
        }))
        .subscribe(observer);

      return () => {

        subscriptionToInternalObservable.unsubscribe();
      };
    });

    this[queueSym] = [];
  }

  userIsPresent(whoami, token) {

    if (this[whoReallyAmISym] !== whoami ||
      this[reallyTokenSym] !== token) {

      if (whoami &&
        token) {

        this[whoReallyAmISym] = whoami;
        this[reallyTokenSym] = token;

        const joinMessage = JSON.stringify({
          'opcode': 'join',
          'whoami': this[whoReallyAmISym],
          'token': this[reallyTokenSym]
        });

        if (this[websocketSym] &&
          this[websocketSym].readyState === WebSocketCtor.OPEN) {

          this[websocketSym].push(joinMessage);
        } else {

          this[queueSym].push(joinMessage);
        }
      } else {

        throw new Error('User identification datas missing.');
      }
    } else {

      throw new Error('User is already identified.');
    }
  }

  sendTo(who, what, managed) {

    if (this[whoReallyAmISym] &&
      this[websocketSym]) {

      const toSend = {
        'whoami': this[whoReallyAmISym],
        who,
        what
      };

      if (managed) {

        toSend.managed = true;
      }

      this[websocketSym].send('sendTo', toSend);
    } else {

      throw new Error('User identification required');
    }
  }

  broadcast(what, managed) {

    if (this[whoReallyAmISym] &&
      this[websocketSym]) {

      const toSend = {
        'whoami': this[whoReallyAmISym],
        'who': '*',
        what
      };

      if (managed) {

        toSend.managed = true;
      }

      this[websocketSym].send('broadcast', toSend);
    } else {

      throw new Error('User identification required');
    }
  }

  get whoAmI() {

    return this[whoReallyAmISym];
  }
}

export default Comunicator;
