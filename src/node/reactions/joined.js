import debug from 'debug';
import jwt from 'jsonwebtoken';

const log = debug('720kb:comunicator:reactions:join')
  , sendToMandatory = () => {
    throw new Error('Missing mandatory parameter sendTo.');
  }
  , connectedSocketsMandatory = () => {
    throw new Error('Missing mandatory parameter connectedSockets.');
  }
  , sendPendingRequestsMandatory = () => {
    throw new Error('Missing mandatory parameter sendPendingRequests.');
  }
  , jwtSaltKeyMandatory = () => {
    throw new Error('Missing mandatory parameter jwtSaltKeyMandatory.');
  }
  , contextMandatory = () => {
    throw new Error('Missing context');
  }
  , messageMandatory = () => {
    throw new Error('Missing mandatory parameter message.');
  }
  , socketMandatory = () => {
    throw new Error('Missing mandatory parameter socket.');
  }
  , subscriberMandatory = () => {
    throw new Error('Missing mandatory parameter subscriber.');
  }
  , whoamiMandatory = () => {
    throw new Error('Missing mandatory message parameter whoami.');
  }
  , tokenMandatory = () => {
    throw new Error('Missing mandatory message parameter token.');
  }
  , sendMandatory = () => {
    throw new Error('Missing mandatory socket parameter send.');
  }
  , nextMandatory = () => {
    throw new Error('Missing mandatory subscriber parameter next.');
  }
  , errorMandatory = () => {
    throw new Error('Missing mandatory subscriber parameter error.');
  };

export default ({
  sendTo = sendToMandatory(),
  connectedSockets = connectedSocketsMandatory(),
  sendPendingRequests = sendPendingRequestsMandatory(),
  jwtSaltKey = jwtSaltKeyMandatory()
} = contextMandatory()) => ({
  'joined': function joined({
      whoami = whoamiMandatory(),
      token = tokenMandatory()
    } = messageMandatory(),
    {
      send = sendMandatory()
    } = socketMandatory(),
    {
      next = nextMandatory(),
      error = errorMandatory()
    } = subscriberMandatory()) {
    const socket = arguments[1];

    log(`-- incoming join from ${whoami}`);
    try {
      const decoded = jwt.verify(token, jwtSaltKey)
        , toSend = {
            'opcode': 'joined',
            whoami
          };

      log(`-- valid token for ${decoded}`);
      connectedSockets.set(whoami, socket);
      send(JSON.stringify(toSend));
      next({
        'type': 'user-joined',
        whoami
      });

      if (sendPendingRequests.has(whoami)) {
        log(`-- there are pending request for ${whoami}...`);
        for (const aSendPendingRequest of sendPendingRequests.get(whoami)) {
          if (aSendPendingRequest &&
            aSendPendingRequest.whoami &&
            aSendPendingRequest.who &&
            aSendPendingRequest.what) {

            sendTo(aSendPendingRequest.whoami,
              aSendPendingRequest.who,
              aSendPendingRequest.what);
            log(`-- ${aSendPendingRequest} sent`);
          } else {

            log(`-- ${aSendPendingRequest} is not well formed`);
            error({
              'type': 'warning',
              'cause': 'A pending request is invalid.'
            });
          }
        }
        sendPendingRequests.delete(whoami);
      } else {

        log(`-- there aren't pending request for ${whoami}`);
        next({
          'type': 'no-pending-messages',
          whoami
        });
      }
    } catch (err) {

      log(`-- invalid token for ${whoami}: ${err.message}`);
      return error({
        'type': 'error',
        'cause': err.message
      });
    }
  }
});
