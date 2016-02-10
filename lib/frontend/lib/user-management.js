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

export default ({whoReallyAmI, reallyToken, websocket}) => ({
  'userIsPresent': (whoami, token) => {

    if (whoReallyAmI !== whoami ||
      reallyToken !== token) {

      if (whoReallyAmI &&
        reallyToken) {

        /*whoReallyAmI = whoami;
        reallyToken = token;
        this.doJoin();*/
        return {
          whoami,
          token
        };
      }

      throw new Error('User identification datas missing.');
    } else {

      window.console.info('User is already identified.');
    }
  },
  'whoAmI': () => {

    return whoReallyAmI;
  },
  'exit': () => {

    if (whoReallyAmI &&
      reallyToken &&
      websocket.readyState === WebSocketCtor.OPEN) {

      websocket.close();
      return {
        whoReallyAmI,
        reallyToken
      };
    }
  }
});
