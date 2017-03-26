export default message => {

  log(`-- incoming sent message from ${parsedMsg.data.whoami} to ${parsedMsg.data.who}`);
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
        'who': parsedMsg.data.who,
        'what': parsedMsg.data.what
      });
      if (!parsedMsg.data.managed) {

        this.sendTo(parsedMsg.data.whoami, parsedMsg.data.who, parsedMsg.data.what);
      }
    }
  });
};
