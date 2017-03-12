const connectedSocketsMandatory = () => {
    throw new Error('Missing mandatory parameter connectedSockets');
  }
  , contextMandatory = () => {
    throw new Error('Missing context');
  }
  , whoMandatory = () => {
    throw new Error('Missing mandatory parameter who.');
  };

export default ({connectedSockets = connectedSocketsMandatory()} = contextMandatory()) => ({
  'isUserPresent': (who = whoMandatory()) => {

    return connectedSockets.has(who);
  }
});
