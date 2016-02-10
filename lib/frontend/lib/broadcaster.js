export default ({whoReallyAmI, websocket}) => ({
  'broadcast': (what, managed) => {

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
