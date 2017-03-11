const whoMandatory = () => {
  throw new Error('Missing mandatory parameter who.');
}
, whatMandatory = () => {
  throw new Error('Missing mandatory parameter what.');
}
, whoReallyAmIMandatory = () => {
  throw new Error('Missing mandatory parameter whoAmI.');
}
, websocketMandatory = () => {
  throw new Error('Missing mandatory parameter websocket.');
};

export default ({whoReallyAmI = whoReallyAmIMandatory(), websocket = websocketMandatory()}) => ({
  'sendTo': (who = whoMandatory(), what = whatMandatory(), managed) => {

    if (whoReallyAmI &&
      websocket) {

      const toSend = {
        'whoami': whoReallyAmI,
        who,
        what
      };

      if (managed) {

        toSend.managed = true;
      }

      websocket.send('sendTo', toSend);
    } else {

      throw new Error('User identification required');
    }
  }
});
