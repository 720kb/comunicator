import debug from 'debug';
import jwt from 'jsonwebtoken';

const log = debug('720kb:comunicator:reactions:sendTo')
  , sendToMandatory = () => {
    throw new Error('Missing mandatory parameter sendTo.');
  }
  , jwtSaltKeyMandatory = () => {
    throw new Error('Missing mandatory parameter jwtSaltKey.');
  }
  , contextMandatory = () => {
    throw new Error('Missing context.');
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
  , whoMandatory = () => {
    throw new Error('Missing mandatory message parameter who.');
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
  sendTo = sendToMandatory(),
  jwtSaltKey = jwtSaltKeyMandatory()
} = contextMandatory()) => ({
  'sentTo': function sentTo({
    whoami = whoamiMandatory(),
    token = tokenMandatory(),
    who = whoMandatory(),
    what = whatMandatory(),
    managed
  } = messageMandatory(),
  {
    next = nextMandatory(),
    error = errorMandatory()
  } = subscriberMandatory()) {

    log(`-- incoming sent message from ${whoami} to ${who}`);
    try {
      const decoded = jwt.verify(token, jwtSaltKey);

      log(`-- valid token for ${decoded}`);
      if (!managed) {

        sendTo(whoami, who, what);
      }

      return next({
        'type': 'message-arrived',
        whoami,
        who,
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
