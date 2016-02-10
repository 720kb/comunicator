/*global module*/
module.exports = ({connectedSockets = new Map()}) => ({
  'isUserPresent': who => {
    if (!who) {

      return false;
    }

    return connectedSockets.has(who);
  }
});
