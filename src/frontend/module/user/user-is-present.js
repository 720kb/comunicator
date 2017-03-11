/*global window*/
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

const whoamiMandatory = () => {
  throw new Error('Missing mandatory parameter whoami.');
}
, tokenMandatory = () => {
  throw new Error('Missing mandatory parameter token.');
}
, websocketMandatory = () => {
  throw new Error('Missing mandatory parameter websocket.');
};

export default function UserIsPresentFactory({websocket = websocketMandatory(), queue = []}) {
  const factoryParam = arguments[0];

  return {
    'userIsPresent': (whoami = whoamiMandatory(), token = tokenMandatory()) => {

      if (factoryParam.whoReallyAmI === whoami &&
        factoryParam.reallyToken === token) {

        throw new Error('User is already identified.');
      }

      factoryParam.whoReallyAmI = whoami;
      factoryParam.reallyToken = token;

      const joinMessage = JSON.stringify({
        'opcode': 'join',
        'whoami': factoryParam.whoReallyAmI,
        'token': factoryParam.reallyToken
      });

      if (websocket &&
        websocket.readyState === WebSocketCtor.OPEN) {

        websocket.push(joinMessage);
      } else {

        queue.push(joinMessage);
      }
    }
  };
}
