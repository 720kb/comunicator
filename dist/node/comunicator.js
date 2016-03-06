'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
* comunicator
* 3.0.1
*
* The 720kb notifier api (atm it uses websockets)
* https://github.com/720kb/comunicator
*
* MIT license
* Sun Mar 06 2016
*/
/*global require,module*/
var ws = require('ws'),
    jwt = require('jsonwebtoken'),
    Rx = require('rxjs/Rx'),
    user = require('./user'),
    sendTo = require('./send-to'),
    broadcast = require('./broadcast'),
    debug = require('debug')('720kb:comunicator:debug'),
    comunicatorState = {
  'connectedSockets': new Map(),
  'sendPendingRequests': new Map()
};

var Comunicator = function (_Rx$Observable) {
  _inherits(Comunicator, _Rx$Observable);

  function Comunicator(websocketConfigurations, jwtSaltKey) {
    var _this;

    _classCallCheck(this, Comunicator);

    if (!websocketConfigurations || !jwtSaltKey) {

      throw new Error('Missing mandatory parameters [websocketConfigurations] - [jwtSaltKey]: ' + websocketConfigurations + ' - ' + jwtSaltKey);
    }
    var internalObservable = new Rx.Observable(function (subscriber) {

      var socketServer = new ws.Server(websocketConfigurations, function () {
        return subscriber.next({
          'type': 'ready'
        });
      });

      socketServer.on('error', function (err) {
        return subscriber.error({
          'type': 'error',
          'cause': err
        });
      });

      socketServer.on('connection', function (socket) {

        subscriber.next({
          'type': 'open',
          'whoami': socket
        });

        socket.on('close', function () {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {

            for (var _iterator = comunicatorState.connectedSockets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var aSocket = _step.value;


              if (aSocket && aSocket.length === 2 && socket === aSocket[1]) {

                if (isNaN(aSocket[0])) {

                  subscriber.next({
                    'type': 'user-leave',
                    'whoami': aSocket[0]
                  });
                } else {

                  subscriber.next({
                    'type': 'user-leave',
                    'whoami': Number(aSocket[0])
                  });
                }

                comunicatorState.connectedSockets.delete(aSocket[0]);
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        });

        socket.on('error', function (err) {
          return subscriber.error({
            'type': 'error',
            'cause': err
          });
        });

        socket.on('message', function (message) {
          var parsedMsg = JSON.parse(message);

          /* {'opcode': 'join', 'whoami': <id>, 'token': <jwt-token>} */
          if (parsedMsg.opcode === 'join') {

            debug('-- incoming join from ' + parsedMsg.whoami);
            jwt.verify(parsedMsg.token, jwtSaltKey, function (err) {

              if (err) {

                subscriber.error({
                  'type': 'error',
                  'cause': err
                });
              } else {

                comunicatorState.connectedSockets.set(parsedMsg.whoami, socket);
                var toSend = {
                  'opcode': 'joined',
                  'whoami': parsedMsg.whoami,
                  'token': parsedMsg.token
                };

                socket.send(JSON.stringify(toSend));
                subscriber.next({
                  'type': 'user-joined',
                  'whoami': parsedMsg.whoami
                });
                if (comunicatorState.sendPendingRequests.has(parsedMsg.whoami)) {
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {

                    for (var _iterator2 = comunicatorState.sendPendingRequests.get(parsedMsg.whoami)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var aSendPendingRequest = _step2.value;

                      if (aSendPendingRequest && aSendPendingRequest.whoami && aSendPendingRequest.who && aSendPendingRequest.what) {

                        _this.sendTo(aSendPendingRequest.whoami, aSendPendingRequest.who, aSendPendingRequest.what);
                      } else {

                        subscriber.error({
                          'type': 'warning',
                          'cause': 'A sending pending request is invalid.'
                        });
                      }
                    }
                  } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                      }
                    } finally {
                      if (_didIteratorError2) {
                        throw _iteratorError2;
                      }
                    }
                  }

                  comunicatorState.sendPendingRequests.delete(parsedMsg.whoami);
                } else {

                  subscriber.next({
                    'type': 'no-pending-messages',
                    'whoami': parsedMsg.whoami
                  });
                }
              }
            });
          } else
            /* {'opcode': 'sendTo', 'token': <jwt-token>, 'data': {'whoami': <id>, 'who': <id>, 'what': payload}} */
            if (parsedMsg.opcode === 'sendTo' && parsedMsg.data && parsedMsg.data.who && parsedMsg.data.whoami && parsedMsg.data.what) {

              /*eslint-disable no-console*/
              debug('-- incoming sent message from ' + parsedMsg.data.whoami + ' to ' + parsedMsg.data.who);
              /*eslint-enable no-console*/
              jwt.verify(parsedMsg.token, jwtSaltKey, function (err) {

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

                    _this.sendTo(parsedMsg.data.whoami, parsedMsg.data.who, parsedMsg.data.what);
                  }
                }
              });
            } else
              /* {'whoami': whoami, 'token': <jwt-token>, 'data': {'who': '*', 'what': what}} */
              if (parsedMsg.opcode === 'broadcast' && parsedMsg.data && parsedMsg.data.whoami && parsedMsg.data.what) {

                debug('-- incoming broadcast message from ' + parsedMsg.data.whoami);
                jwt.verify(parsedMsg.token, jwtSaltKey, function (err) {

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

                      _this.broadcast(parsedMsg.data.whoami, parsedMsg.data.what);
                    }
                  }
                });
              } else {

                subscriber.error({
                  'type': 'warning',
                  'cause': 'operation not permitted: ' + JSON.stringify(parsedMsg)
                });
              }
        });
      });

      return function () {

        socketServer.close();
      };
    }).share();

    return _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Comunicator).call(this, function (observer) {

      var subscriptionToInternalObservable = internalObservable.subscribe(observer);

      return function () {

        subscriptionToInternalObservable.unsubscribe();
      };
    }));
  }

  return Comunicator;
}(Rx.Observable);

Object.assign(Comunicator.prototype, user(comunicatorState), sendTo(comunicatorState), broadcast(comunicatorState));

module.exports = {
  Comunicator: Comunicator,
  'hapiComunicator': require('./hapi-plugin')(Comunicator)
};
//# sourceMappingURL=comunicator.js.map
