import ws from 'ws';
import debug from 'debug';

const log = debug('720kb:comunicator:sender:debug')
  , connectedSocketsMandatory = () => {
    throw new Error('Missing mandatory parameter connectedSockets.');
  }
  , sendPendingRequestsMandatory = () => {
    throw new Error('Missing mandatory parameter sendPendingRequests.');
  }
  , whoAmIMandatory = () => {
    throw new Error('Missing mandatory parameter whoami.');
  }
  , whoMandatory = () => {
    throw new Error('Missing mandatory parameter who.');
  }
  , whatMandatory = () => {
    throw new Error('Missing mandatory parameter what.');
  }
  , missingContext = () => {
    throw new Error('Missing context');
  };

export default ({connectedSockets = connectedSocketsMandatory(), sendPendingRequests = sendPendingRequestsMandatory()} = missingContext()) => ({
  'sendTo': (whoami = whoAmIMandatory(), who = whoMandatory(), what = whatMandatory()) => {
    const toSend = {
        'opcode': 'to-me',
        whoami,
        who,
        what
      }
      , aWebSocket = connectedSockets.get(who);
    let sent = false;

    log(`Sending message from ${whoami} to ${who} via ${aWebSocket}: ${what}`);
    if (Boolean(aWebSocket) &&
      aWebSocket.readyState === ws.OPEN) {

      aWebSocket.send(JSON.stringify(toSend));
      sent = true;
    } else {

      if (!sendPendingRequests.has(who)) {

        sendPendingRequests.set(who, []);
      }

      sendPendingRequests.get(who).push({
        whoami,
        who,
        what
      });
      log(`User ${who} isn't here at the moment...`);
    }

    return sent;
  }
});
