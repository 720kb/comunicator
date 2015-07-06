/*global window*/
(function plainOldJS(window) {
  'use strict';

  var Comunicator = function Comunicator(url) {

    var onTick = function onTick(redoFunction, type) {

      var requestId
        , nextTimeWaitSliceChoice;

      if (this.chosenTimeWaitValue > 0 &&
        this.websocket.readyState !== window.WebSocket.OPEN) {

        this.chosenTimeWaitValue -= 1;
        //window.console.debug('Decreasing chosen time wait value...');
        requestId = window.requestAnimationFrame(onTick.bind(this, redoFunction, type));
        if (type === 'send') {

          this.sendPendingRequests.push(requestId);
        } else {

          this.joinPendingRequests.push(requestId);
        }
      } else {

        nextTimeWaitSliceChoice = this.timeWaitSlice * (Math.pow(2, this.timeWaitSliceChoices.length) - 1);
        this.timeWaitSliceChoices.push(nextTimeWaitSliceChoice);
        this.chosenTimeWaitValue = this.giveMeATimeWait();
        //window.console.debug('Chosen time wait value:', this.chosenTimeWaitValue);
        redoFunction();
      }
    }
    , deferred = function deferred(resolve) {

      var userIsPresent = function userIsPresent(whoami, token) {

        if (this.whoReallyAmI !== whoami ||
          this.reallyToken !== token) {

          this.whoReallyAmI = whoami;
          this.reallyToken = token;
          if (this.whoReallyAmI &&
            this.reallyToken) {

            this.doJoin();
          } else {

            throw 'User identification datas missing.';
          }
        } else {

          window.console.info('User is already identified.');
        }
      }
      , broadcast = function broadcast(what, managed) {

        if (this.whoReallyAmI &&
          this.websocket) {

          var toSend = {
            'whoami': this.whoReallyAmI,
            'who': '*',
            'what': what
          };

          if (managed) {

            toSend.managed = true;
          }

          this.websocket.send('broadcast', toSend);
        } else {

          throw 'User identification required';
        }
      }
      , sendTo = function sendTo(who, what, managed) {

        if (this.whoReallyAmI &&
          this.websocket) {

          var toSend = {
            'whoami': this.whoReallyAmI,
            'who': who,
            'what': what
          };

          if (managed) {

            toSend.managed = true;
          }

          this.websocket.send('sendTo', toSend);
        } else {

          throw 'User identification required';
        }
      }
      , doClose = function doClose() {

        if (this.websocket.readyState === window.WebSocket.OPEN) {

          this.websocket.close();
        }
      }
      , whoAmI = function whoAmI() {

        return this.whoReallyAmI;
      }
      , resolveComunicator = function resolveComunicator() {

        window.removeEventListener(this.eventToListen, resolveComunicator, false);
        resolve({
          'whoAmI': whoAmI.bind(this),
          'userIsPresent': userIsPresent.bind(this),
          'broadcast': broadcast.bind(this),
          'sendTo': sendTo.bind(this),
          'exit': doClose.bind(this)
        });
      };

      window.addEventListener(this.eventToListen, resolveComunicator.bind(this), false);
    };

    this.eventToListen = 'comunicator:ready';
    this.timeWaitSlice = 9000;
    this.timeWaitSliceChoices = [0];
    this.chosenTimeWaitValue = 0;
    this.sendPendingRequests = [];
    this.joinPendingRequests = [];
    this.giveMeATimeWait = function giveMeATimeWait() {

      return Math.floor(Math.random() * (this.timeWaitSliceChoices.length + 1));
    };
    this.doJoin = function doJoin() {

      var onTickBoundedOnDoJoin = onTick.bind(this, this.doJoin.bind(this), 'join')
        , requestId
        , joinPendingRequestsIndex = 0
        , joinPendingRequestsLength
        , aPendingRequest;

      if (this.websocket.readyState === window.WebSocket.OPEN) {

        this.websocket.push(JSON.stringify({
          'opcode': 'join',
          'whoami': this.whoReallyAmI,
          'token': this.reallyToken
        }));

        for (joinPendingRequestsIndex = 0, joinPendingRequestsLength = this.joinPendingRequests.length; joinPendingRequestsIndex < joinPendingRequestsLength; joinPendingRequestsIndex += 1) {

          aPendingRequest = this.joinPendingRequests[joinPendingRequestsIndex];
          window.cancelAnimationFrame(aPendingRequest);
        }
        this.joinPendingRequests = [];
      } else if (this.websocket.readyState === window.WebSocket.CONNECTING) {

        //window.console.info('Trasport to server is not yet ready. Delay joining...');
        requestId = window.requestAnimationFrame(onTickBoundedOnDoJoin);
        this.joinPendingRequests.push(requestId);
      } else {

        //window.console.info('Trasport to server is down by now. Delay joining...');
        this.initComunicator(this.websocket.url);
        this.websocket.send = this.sendMessage.bind(this);
        this.websocket.onmessage = this.onWebsocketMessage.bind(this);
        this.websocket.onclose = this.onWebsocketClose.bind(this);
        requestId = window.requestAnimationFrame(onTickBoundedOnDoJoin);
        this.joinPendingRequests.push(requestId);
      }
    };
    this.onWebsocketMessage = function onWebSocketMessage(event) {

      var parsedMsg = window.JSON.parse(event.data)
        , eventToDispatch;

      if (parsedMsg.opcode === 'joined') {

        eventToDispatch = new window.CustomEvent('comunicator:joined');
      } else if (parsedMsg.opcode === 'sent') {

        eventToDispatch = new window.CustomEvent('comunicator:to-me', {
          'detail': parsedMsg
        });
      } else if (parsedMsg.opcode === 'broadcasted') {

        eventToDispatch = new window.CustomEvent('comunicator:to-all', {
          'detail': parsedMsg
        });
      }

      if (eventToDispatch) {

        window.dispatchEvent(eventToDispatch);
      } else {

        throw 'Operation code from comunicator not reconized';
      }
    };
    this.onWebsocketClose = function onWebsocketClose() {

      if (this.whoReallyAmI &&
        this.reallyToken) {

        window.dispatchEvent(new window.CustomEvent('comunicator:closed'));
        if (this.websocket.readyState !== window.WebSocket.OPEN ||
          this.websocket.readyState !== window.WebSocket.CONNECTING) {

          this.doJoin();
        }
      }
    };
    this.sendMessage = function send(opcode, data) {

      var onTickBoundedOnSend = onTick.bind(this, this.sendMessage.bind(this, opcode, data), 'send')
        , requestId
        , sendPendingRequestsIndex = 0
        , sendPendingRequestsLength
        , aPendingRequest;

      if (this.websocket.readyState === window.WebSocket.OPEN) {

        this.websocket.push(JSON.stringify({
          'opcode': opcode,
          'token': this.reallyToken,
          'data': data
        }));

        for (sendPendingRequestsIndex = 0, sendPendingRequestsLength = this.sendPendingRequests.length; sendPendingRequestsIndex < sendPendingRequestsLength; sendPendingRequestsIndex += 1) {

          aPendingRequest = this.sendPendingRequests[sendPendingRequestsIndex];
          window.cancelAnimationFrame(aPendingRequest);
        }
        this.sendPendingRequests = [];
      } else {

        //window.console.debug('Trasport to server is not ready. Delay sending...');
        requestId = window.requestAnimationFrame(onTickBoundedOnSend);
        this.sendPendingRequests.push(requestId);
      }
    };
    this.initComunicator = function initComunicator(websocketUrl) {
      if (websocketUrl) {
        var that = this;

        this.websocket = new window.WebSocket(websocketUrl);
        this.websocket.onopen = function onWebSocketOpening() {

          window.console.info('Trasport', this, 'opened.');
          window.dispatchEvent(new window.CustomEvent(that.eventToListen));
        };
      } else {

        throw 'Please provide a valid URL.';
      }

      this.websocket.push = this.websocket.send;
      this.websocket.send = this.sendMessage.bind(this);
      this.websocket.onmessage = this.onWebsocketMessage.bind(this);
      this.websocket.onclose = this.onWebsocketClose.bind(this);
    };

    this.initComunicator(url);
    return new Promise(deferred.bind(this));
  };

  window.Comunicator = Comunicator;
}(window));
