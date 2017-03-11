const whatMandatory = () => {
  throw new Error('Missing mandatory parameter what.');
}
, whoReallyAmIMandatory = () => {
  throw new Error('Missing mandatory parameter whoAmI.');
}
, websocketMandatory = () => {
  throw new Error('Missing mandatory parameter websocket.');
};

export default ({whoReallyAmI = whoReallyAmIMandatory(), websocket = websocketMandatory()}) => ({
  'broadcast': (what = whatMandatory(), managed) => {

    if (whoReallyAmI &&
      websocket) {

      const toSend = {
        'whoami': whoReallyAmI,
        'who': '*',
        what
      };

      if (managed) {

        toSend.managed = true;
      }

      websocket.send('broadcast', toSend);
    } else {

      throw new Error('User identification required');
    }
  }
});
