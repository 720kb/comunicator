'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hapiComunicator = exports.default = undefined;

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _rxjs = require('@reactivex/rxjs');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _sendTo = require('./action/send-to');

var _sendTo2 = _interopRequireDefault(_sendTo);

var _broadcast = require('./action/broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _plugin = require('./hapi/plugin');

var _plugin2 = _interopRequireDefault(_plugin);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var log = (0, _debug2.default)('720kb:comunicator:debug'),
    websocketConfigurationsMandatory = function websocketConfigurationsMandatory() {
  throw new Error('Missing mandatory parameter websocketConfigurations.');
},
    jwtSaltKeyMandatory = function jwtSaltKeyMandatory() {
  throw new Error('Missing mandatory parameter jwtSaltKey.');
};

var Comunicator = function (_Observable) {
  _inherits(Comunicator, _Observable);

  function Comunicator() {
    var websocketConfigurations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : websocketConfigurationsMandatory();
    var jwtSaltKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : jwtSaltKeyMandatory();

    _classCallCheck(this, Comunicator);

    var comunicatorState = {
      'connectedSockets': new Map(),
      'sendPendingRequests': new Map()
    },
        internalObservable = new _rxjs.Observable(function (subscriber) {

      var socketServer = new _ws2.default.Server(websocketConfigurations, function () {
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

            log('-- incoming join from ' + parsedMsg.whoami);
            _jsonwebtoken2.default.verify(parsedMsg.token, jwtSaltKey, function (err) {

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
              log('-- incoming sent message from ' + parsedMsg.data.whoami + ' to ' + parsedMsg.data.who);
              /*eslint-enable no-console*/
              _jsonwebtoken2.default.verify(parsedMsg.token, jwtSaltKey, function (err) {

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

                log('-- incoming broadcast message from ' + parsedMsg.data.whoami);
                _jsonwebtoken2.default.verify(parsedMsg.token, jwtSaltKey, function (err) {

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

    var _this = _possibleConstructorReturn(this, (Comunicator.__proto__ || Object.getPrototypeOf(Comunicator)).call(this, function (observer) {

      var subscriptionToInternalObservable = internalObservable.subscribe(observer);

      return function () {

        subscriptionToInternalObservable.unsubscribe();
      };
    }));

    Object.assign(Comunicator.prototype, (0, _user2.default)(comunicatorState), (0, _sendTo2.default)(comunicatorState), (0, _broadcast2.default)(comunicatorState));
    return _this;
  }

  return Comunicator;
}(_rxjs.Observable);

/*eslint-disable one-var*/


var hapiComunicator = (0, _plugin2.default)(_package2.default, Comunicator);
/*eslint-enable*/

exports.default = Comunicator;
exports.hapiComunicator = hapiComunicator;
//# sourceMappingURL=comunicator.js.map
