export default ({connectedSockets = new Map()}) => ({
  'isUserPresent': who => {

    return connectedSockets.has(who);
  }
});
