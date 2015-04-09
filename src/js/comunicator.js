/*global window*/
(function plainOldJS(window) {
  'use strict';

  var Comunicator = function Comunicator(url) {
      this.initComunicator = function initComunicator(websocketUrl) {
        if (websocketUrl) {

          this.websocket = new window.WebSocket(websocketUrl);
          this.websocket.onopen = function onWebSocketOpening() {

            window.console.info('Trasport', this, 'opened.');
          };
        } else {

          throw 'Please provide a valid URL.';
        }

        this.websocket.push = this.websocket.send;
      };

      this.timeWaitSlice = 64;
      this.timeWaitSliceChoices = [0];
      this.chosenTimeWaitValue = 0;
      this.sendPendingRequests = [];
      this.joinPendingRequests = [];
      this.giveMeATimeWait = function giveMeATimeWait() {

        return Math.floor(Math.random() * (this.timeWaitSliceChoices.length + 1));
      };

      this.initComunicator(url);
    };

  Comunicator.prototype.promise = function promise(events) {

    if (!this.websocket) {

      throw 'Mandatory field comunicatorServerURL required';
    }

    if (events &&
      Array.isArray(events)) {

      return new Promise(function deferred(resolve) {

        var eventsToListenLength = events.length
          , eventsToListenIndex
          , anEventToListen
          , onTick = function onTick(redoFunction, type) {

              var requestId
                , nextTimeWaitSliceChoice;
              if (this.chosenTimeWaitValue > 0 &&
                this.websocket.readyState !== window.WebSocket.OPEN) {

                this.chosenTimeWaitValue -= 1;
                window.console.debug('Decreasing chosen time wait value...');
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
                window.console.debug('Chosen time wait value:', this.chosenTimeWaitValue);
                redoFunction();
              }
            }
          , onWebsocketMessage = function onWebSocketMessage(event) {

              var parsedMsg = window.JSON.parse(event.data)
                , eventToDispatch;
              if (parsedMsg.opcode === 'joined') {

                eventToDispatch = new window.CustomEvent('comunicator:joined');
              } else if (parsedMsg.opcode === 'sent') {

                eventToDispatch = new window.CustomEvent('comunicator:toMe', {'detail': parsedMsg});
              } else if (parsedMsg.opcode === 'broadcasted') {

                eventToDispatch = new window.CustomEvent('comunicator:toAll', {'detail': parsedMsg});
              }

              if (eventToDispatch) {

                window.dispatchEvent(eventToDispatch);
              } else {

                throw 'Operation code from comunicator not reconized';
              }
            }
          , onWebsocketClose = function onWebsocketClose() {

              if (this.whoReallyAmI &&
                this.reallyToken) {

                window.dispatchEvent(new window.CustomEvent('comunicator:closed'));
                /*eslint-disable no-use-before-define*/
                doJoin();
                /*eslint-enable no-use-before-define*/
              }
            }
          , sendMessage = function send(opcode, data) {

              var onTickBoundedOnSend = onTick.bind(this, sendMessage.bind(this, opcode, data), 'send')
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

                window.console.debug('Trasport to server is not ready. Delay sending...');
                requestId = window.requestAnimationFrame(onTickBoundedOnSend);
                this.sendPendingRequests.push(requestId);
              }
            }
          , doJoin = function doJoin() {

              var onTickBoundedOnDoJoin = onTick.bind(this, doJoin, 'join')
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

                window.console.info('Trasport to server is not yet ready. Delay joining...');
                requestId = window.requestAnimationFrame(onTickBoundedOnDoJoin);
                this.joinPendingRequests.push(requestId);
              } else {

                window.console.info('Trasport to server is down by now. Delay joining...');
                this.initComunicator(this.websocket.url);
                this.websocket.send = sendMessage;
                this.websocket.onmessage = onWebsocketMessage;
                this.websocket.onclose = onWebsocketClose;
                requestId = window.requestAnimationFrame(onTickBoundedOnDoJoin);
                this.joinPendingRequests.push(requestId);
              }
            }
          , userIsPresent = function userIsPresent(whoami, token) {

              this.whoReallyAmI = whoami;
              this.reallyToken = token;
              if (this.whoReallyAmI &&
                this.reallyToken) {

                doJoin();
              } else {

                throw 'User identification datas missing.';
              }
            }
          , broadcast = function broadcast(what) {

              if (this.whoReallyAmI &&
                this.websocket) {

                var toSend = {
                  'whoami': this.whoReallyAmI,
                  'who': '*',
                  'what': what
                };

                this.websocket.send('broadcast', toSend);
              } else {

                throw 'User identification required';
              }
            }
          , sendTo = function sendTo(who, what) {

              if (this.whoReallyAmI &&
                this.websocket) {

                var toSend = {
                  'whoami': this.whoReallyAmI,
                  'who': who,
                  'what': what
                };

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
          , resolveComunicator = function resolveComunicator() {

              for (eventsToListenIndex = 0; eventsToListenIndex < eventsToListenLength; eventsToListenIndex += 1) {

                anEventToListen = events[eventsToListenIndex];
                if (anEventToListen) {

                  window.removeEventListener(anEventToListen, resolveComunicator, false);
                }
              }

              resolve({
                'userIsPresent': userIsPresent,
                'broadcast': broadcast,
                'sendTo': sendTo,
                'exit': doClose
              });
            };

        for (eventsToListenIndex = 0; eventsToListenIndex < eventsToListenLength; eventsToListenIndex += 1) {

          anEventToListen = events[eventsToListenIndex];
          if (anEventToListen) {

            window.addEventListener(anEventToListen, resolveComunicator, false);
          }
        }

        this.websocket.send = sendMessage;
        this.websocket.onmessage = onWebsocketMessage;
        this.websocket.onclose = onWebsocketClose;
      });
    }

    throw 'events must be defined and must be an array';
  };

  window.Comunicator = Comunicator;
}(window));
