/*global window*/
import {WebSocket} from 'ws';
let WebSocketCtor;

try {

  WebSocketCtor = WebSocket;
  if (!WebSocketCtor) {

    WebSocketCtor = window.WebSocket;
  }
} catch (err) {

  WebSocketCtor = window.WebSocket;
}

export const sendMessageFactory = ({reallyToken, websocket, queue = []}) => ({
  'sendMessage': (opcode, data) => {
    const messageToSend = JSON.stringify({
      opcode,
      'token': reallyToken,
      data
    });

    if (websocket.readyState === WebSocketCtor.OPEN) {

      websocket.push(messageToSend);
    } else {

      queue.push(messageToSend);
    }
  }
});

export default ({whoReallyAmI, websocket}) => ({
  'sendTo': (who, what, managed) => {

    if (whoReallyAmI &&
      websocket) {

      const toSend = {
        'whoami': whoReallyAmI,
        who,
        what
      };

      if (managed) {

        toSend.managed = true;
      }

      websocket.send('sendTo', toSend);
    } else {

      throw new Error('User identification required');
    }
  }
});
