export default message => {

  log(`-- incoming broadcast message from ${parsedMsg.data.whoami}`);
  jwt.verify(parsedMsg.token, jwtSaltKey, err => {

    if (err) {

      subscriber.error({
        'type': 'error',
        'cause': err
      });
    } else {

      subscriber.next({
        'type': 'message-arrived',
        'whoami': parsedMsg.data.whoami,
        'who': '*',
        'what': parsedMsg.data.what
      });

      if (!parsedMsg.data.managed) {

        this.broadcast(parsedMsg.data.whoami, parsedMsg.data.what);
      }
    }
  });
};
