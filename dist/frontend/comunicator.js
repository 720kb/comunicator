'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Comunicator = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rx = require('rxjs/Rx');

var _Rx2 = _interopRequireDefault(_Rx);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*global window*/


var WebSocketCtor = void 0;

try {

  WebSocketCtor = _ws2.default;
  if (!WebSocketCtor) {

    WebSocketCtor = window.WebSocket;
  }
} catch (err) {

  WebSocketCtor = window.WebSocket;
}

var whoReallyAmISym = Symbol('whoReallyAmI'),
    reallyTokenSym = Symbol('reallyToken'),
    websocketSym = Symbol('websocket'),
    queueSym = Symbol('queue'),
    timeWaitSlice = 9000,
    timeWaitSliceChoices = [0],
    giveMeATimeWait = function giveMeATimeWait() {

  return Math.floor(Math.random() * (timeWaitSliceChoices.length + 1));
};

var Comunicator = function (_Rx$Observable) {
  _inherits(Comunicator, _Rx$Observable);

  function Comunicator(websocketUrl) {
    _classCallCheck(this, Comunicator);

    if (!websocketUrl) {

      throw new Error('Mandatory parameter is missing: [websocketUrl] ' + websocketUrl);
    }

    var internalObservable = new _Rx2.default.Observable(function (subscriber) {
      var inError = false;

      if (_this[websocketSym] && (_this[websocketSym].readyState !== WebSocketCtor.CONNECTING || _this[websocketSym].readyState !== WebSocketCtor.OPEN)) {

        inError = true;
      }

      if (typeof websocketUrl === 'string') {

        _this[websocketSym] = new WebSocketCtor(websocketUrl);
      } else if ((typeof websocketUrl === 'undefined' ? 'undefined' : _typeof(websocketUrl)) === 'object' && websocketUrl instanceof WebSocketCtor) {

        _this[websocketSym] = websocketUrl;
      } else {

        throw new Error('websocket parameter passed is neither a string nor a WebSocket object');
      }

      _this[websocketSym].onopen = function (event) {

        subscriber.next({
          'type': 'open',
          'whoami': event.target
        });

        while (_this[queueSym].length > 0 && _this[websocketSym].readyState === WebSocketCtor.OPEN) {

          _this[websocketSym].push(_this[queueSym].shift());
        }
      };

      _this[websocketSym].onmessage = function (event) {
        var parsedMsg = JSON.parse(event.data);

        if (parsedMsg.opcode === 'joined') {

          subscriber.next({
            'type': 'joined',
            'whoami': parsedMsg.whoami
          });
        } else if (parsedMsg.opcode === 'to-me') {

          subscriber.next({
            'type': 'to-me',
            'whoami': parsedMsg.whoami,
            'who': parsedMsg.who,
            'what': parsedMsg.what
          });
        } else if (parsedMsg.opcode === 'to-all') {

          subscriber.next({
            'type': 'to-all',
            'whoami': parsedMsg.whoami,
            'what': parsedMsg.what
          });
        }
      };

      _this[websocketSym].onerror = function (error) {

        subscriber.error({
          'type': 'error',
          'cause': error
        });
      };

      _this[websocketSym].onclose = function () {

        subscriber.error({
          'type': 'closed'
        });
      };

      _this[websocketSym].push = _this[websocketSym].send;
      _this[websocketSym].send = function (opcode, data) {
        var messageToSend = JSON.stringify({
          opcode: opcode,
          'token': _this[reallyTokenSym],
          data: data
        });

        if (_this[websocketSym] && _this[websocketSym].readyState === WebSocketCtor.OPEN) {

          _this[websocketSym].push(messageToSend);
        } else {

          _this[queueSym].push(messageToSend);
        }
      };

      if (inError && _this[websocketSym].readyState !== WebSocketCtor.CONNECTING && _this[websocketSym].readyState !== WebSocketCtor.OPEN) {

        subscriber.error({
          'type': 'closed'
        });
      }

      return function () {

        _this[websocketSym].close();
      };
    }).share();

    var _this = _possibleConstructorReturn(this, (Comunicator.__proto__ || Object.getPrototypeOf(Comunicator)).call(this, function (observer) {

      var subscriptionToInternalObservable = internalObservable.retryWhen(function (errors) {
        return errors.switchMap(function () {
          var nextTimeWaitSliceChoice = timeWaitSlice * (Math.pow(2, timeWaitSliceChoices.length) - 1);

          timeWaitSliceChoices.push(nextTimeWaitSliceChoice);
          return _Rx2.default.Observable.timer(timeWaitSliceChoices[giveMeATimeWait()]);
        });
      }).subscribe(observer);

      return function () {

        subscriptionToInternalObservable.unsubscribe();
      };
    }));

    _this[queueSym] = [];
    return _this;
  }

  _createClass(Comunicator, [{
    key: 'userIsPresent',
    value: function userIsPresent(whoami, token) {

      if (this[whoReallyAmISym] !== whoami || this[reallyTokenSym] !== token) {

        if (whoami && token) {

          this[whoReallyAmISym] = whoami;
          this[reallyTokenSym] = token;

          var joinMessage = JSON.stringify({
            'opcode': 'join',
            'whoami': this[whoReallyAmISym],
            'token': this[reallyTokenSym]
          });

          if (this[websocketSym] && this[websocketSym].readyState === WebSocketCtor.OPEN) {

            this[websocketSym].push(joinMessage);
          } else {

            this[queueSym].push(joinMessage);
          }
        } else {

          throw new Error('User identification datas missing.');
        }
      } else {

        throw new Error('User is already identified.');
      }
    }
  }, {
    key: 'sendTo',
    value: function sendTo(who, what, managed) {

      if (this[whoReallyAmISym] && this[websocketSym]) {

        var toSend = {
          'whoami': this[whoReallyAmISym],
          who: who,
          what: what
        };

        if (managed) {

          toSend.managed = true;
        }

        this[websocketSym].send('sendTo', toSend);
      } else {

        throw new Error('User identification required');
      }
    }
  }, {
    key: 'broadcast',
    value: function broadcast(what, managed) {

      if (this[whoReallyAmISym] && this[websocketSym]) {

        var toSend = {
          'whoami': this[whoReallyAmISym],
          'who': '*',
          what: what
        };

        if (managed) {

          toSend.managed = true;
        }

        this[websocketSym].send('broadcast', toSend);
      } else {

        throw new Error('User identification required');
      }
    }
  }, {
    key: 'whoAmI',
    get: function get() {

      return this[whoReallyAmISym];
    }
  }]);

  return Comunicator;
}(_Rx2.default.Observable);

exports.Comunicator = Comunicator;
//# sourceMappingURL=comunicator.js.map
