/**
* comunicator
* 2.2.4
*
* The 720kb notifier api (atm it uses websockets)
* https://github.com/720kb/comunicator
*
* MIT license
* Wed Feb 10 2016
*/
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('comunicator', ['exports', 'rxjs/Rx', 'ws'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('rxjs/Rx'), require('ws'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Rx, global.ws);
    global.comunicator = mod.exports;
  }
})(this, function (exports, _Rx, _ws) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _Rx2 = _interopRequireDefault(_Rx);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var WebSocketCtor$1 = undefined;

  try {

    WebSocketCtor$1 = _ws.WebSocket;
    if (!WebSocketCtor$1) {

      WebSocketCtor$1 = window.WebSocket;
    }
  } catch (err) {

    WebSocketCtor$1 = window.WebSocket;
  }

  var sendMessageFactory = function sendMessageFactory(_ref) {
    var reallyToken = _ref.reallyToken;
    var websocket = _ref.websocket;
    var _ref$queue = _ref.queue;
    var queue = _ref$queue === undefined ? [] : _ref$queue;
    return {
      'sendMessage': function sendMessage(opcode, data) {
        var messageToSend = JSON.stringify({
          opcode: opcode,
          'token': reallyToken,
          data: data
        });

        if (websocket.readyState === WebSocketCtor$1.OPEN) {

          websocket.push(messageToSend);
        } else {

          queue.push(messageToSend);
        }
      }
    };
  };

  var sender = function sender(_ref2) {
    var whoReallyAmI = _ref2.whoReallyAmI;
    var websocket = _ref2.websocket;
    return {
      'sendTo': function sendTo(who, what, managed) {

        if (whoReallyAmI && websocket) {

          var toSend = {
            'whoami': whoReallyAmI,
            who: who,
            what: what
          };

          if (managed) {

            toSend.managed = true;
          }

          websocket.send('sendTo', toSend);
        } else {

          throw new Error('User identification required');
        }
      }
    };
  };

  var broadcaster = function broadcaster(_ref3) {
    var whoReallyAmI = _ref3.whoReallyAmI;
    var websocket = _ref3.websocket;
    return {
      'broadcast': function broadcast(what, managed) {

        if (whoReallyAmI && websocket) {

          var toSend = {
            'whoami': whoReallyAmI,
            'who': '*',
            what: what
          };

          if (managed) {

            toSend.managed = true;
          }

          websocket.send('broadcast', toSend);
        } else {

          throw new Error('User identification required');
        }
      }
    };
  };

  var comunicatorState = {
    'whoReallyAmI': undefined,
    'reallyToken': undefined,
    'websocket': undefined,
    'queue': []
  };
  var doJoinSym = Symbol('doJoin');
  var WebSocketCtor = undefined;

  try {

    WebSocketCtor = _ws.WebSocket;
    if (!WebSocketCtor) {

      WebSocketCtor = window.WebSocket;
    }
  } catch (err) {

    WebSocketCtor = window.WebSocket;
  }

  var Comunicator = function (_Rx$Observable) {
    _inherits(Comunicator, _Rx$Observable);

    function Comunicator(websocketUrl) {
      _classCallCheck(this, Comunicator);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Comunicator).call(this, function (observer) {

        if (websocketUrl) {

          if (typeof websocketUrl === 'string') {

            comunicatorState.websocket = new WebSocketCtor(websocketUrl);
          } else if ((typeof websocketUrl === 'undefined' ? 'undefined' : _typeof(websocketUrl)) === 'object' && websocketUrl instanceof WebSocketCtor) {

            comunicatorState.websocket = websocketUrl;
          } else {

            observer.error({
              'type': 'error',
              'cause': 'websocket parameter passed is neither a string nor a WebSocket object'
            });
          }

          observer.next({
            'type': 'ready'
          });

          comunicatorState.websocket.onopen = function (openEvent) {

            observer.next({
              'type': 'open',
              'whoami': openEvent.target
            });

            while (comunicatorState.queue.length > 0 && comunicatorState.websocket.readyState === WebSocketCtor.OPEN) {

              comunicatorState.websocket.push(comunicatorState.queue.shift());
            }
          };

          comunicatorState.websocket.onmessage = function (event) {
            var parsedMsg = window.JSON.parse(event.data);

            if (parsedMsg.opcode === 'joined') {

              observer.next({
                'type': 'joined',
                'value': parsedMsg
              });
            } else if (parsedMsg.opcode === 'sent') {

              observer.next({
                'type': 'to-me',
                'value': parsedMsg
              });
            } else if (parsedMsg.opcode === 'broadcasted') {

              observer.next({
                'type': 'to-all',
                'value': parsedMsg
              });
            }
          };
          comunicatorState.websocket.onclose = function () {

            if (comunicatorState.whoReallyAmI && comunicatorState.reallyToken) {

              observer.next({
                'type': 'closed'
              });
              observer.complete();
            }
          };

          comunicatorState.websocket.push = comunicatorState.websocket.send;
          comunicatorState.websocket.send = sendMessageFactory(comunicatorState);
        } else {

          observer.error({
            'type': 'error',
            'cause': 'Please provide a valid URL.'
          });
        }
      }));

      _this[doJoinSym] = function () {
        var joinMessage = JSON.stringify({
          'opcode': 'join',
          'whoami': comunicatorState.whoReallyAmI,
          'token': comunicatorState.reallyToken
        });

        if (comunicatorState.websocket.readyState === WebSocketCtor.OPEN) {

          comunicatorState.websocket.push(joinMessage);
        } else {

          comunicatorState.queue.push(joinMessage);
        }
      };
      return _this;
    }

    _createClass(Comunicator, [{
      key: 'userIsPresent',
      value: function userIsPresent(whoami, token) {

        if (comunicatorState.whoReallyAmI !== whoami || comunicatorState.reallyToken !== token) {

          if (whoami && token) {

            comunicatorState.whoReallyAmI = whoami;
            comunicatorState.reallyToken = token;
            this[doJoinSym]();
          }

          throw new Error('User identification datas missing.');
        } else {

          window.console.info('User is already identified.');
        }
      }
    }, {
      key: 'exit',
      value: function exit() {

        if (comunicatorState.whoReallyAmI && comunicatorState.reallyToken && comunicatorState.websocket.readyState === WebSocketCtor.OPEN) {

          comunicatorState.websocket.close();
          comunicatorState.whoReallyAmI = undefined;
          comunicatorState.reallyToken = undefined;
        }
      }
    }, {
      key: 'whoAmI',
      get: function get() {

        return comunicatorState.whoReallyAmI;
      }
    }]);

    return Comunicator;
  }(_Rx2.default.Observable);

  Object.assign(Comunicator.prototype, broadcaster(comunicatorState), sender(comunicatorState));

  exports.default = Comunicator;
});
//# sourceMappingURL=comunicator.js.map
