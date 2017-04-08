import debug from 'debug';
import jwt from 'jsonwebtoken';

const log = debug('720kb:comunicator:reactions:broadcast')
  , broadcastMandatory = () => {
    throw new Error('Missing mandatory parameter broadcast.');
  }
  , jwtSaltKeyMandatory = () => {
    throw new Error('Missing mandatory parameter jwtSaltKey.');
  }
  , contextMandatory = () => {
    throw new Error('Missing context');
  }
  , messageMandatory = () => {
    throw new Error('Missing mandatory parameter message.');
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
  , whatMandatory = () => {
    throw new Error('Missing mandatory message parameter what.');
  }
  , nextMandatory = () => {
    throw new Error('Missing mandatory subscriber parameter next.');
  }
  , errorMandatory = () => {
    throw new Error('Missing mandatory subscriber parameter error.');
  };

export default ({
  broadcast = broadcastMandatory(),
  jwtSaltKey = jwtSaltKeyMandatory()
} = contextMandatory()) => ({
  'broadcasted': function broadcasted({
    whoami = whoamiMandatory(),
    token = tokenMandatory(),
    what = whatMandatory(),
    managed
  } = messageMandatory(),
  {
    next = nextMandatory(),
    error = errorMandatory()
  } = subscriberMandatory()) {
    log(`-- incoming broadcast message from ${whoami}`);
    try {
      const decoded = jwt.verify(token, jwtSaltKey);

      log(`-- valid token for ${decoded}`);
      if (!managed) {

        broadcast(whoami, what);
      }
      return next({
        'type': 'message-arrived',
        whoami,
        'who': '*',
        what
      });
    } catch (err) {

      log(`-- invalid token for ${whoami}: ${err.message}`);
      return error({
        'type': 'error',
        'cause': err.message
      });
    }
  }
});
