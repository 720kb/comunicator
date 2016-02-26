/*global module*/
module.exports = ({connectedSockets = new Map()}) => ({
  'isUserPresent': who => {

    return connectedSockets.has(who);
  }
});
