# Comunicator
##### A way to enstablish a websocket connection between users, using your application and your back end.

<div style="text-align:center"><img src="http://720kb.github.io/media/comunicator/logo.svg" alt="logo"></div>
Additionally it reacts to the scenario where either client or server goes offline, enqueing unsent messages waiting for reconnection; this is done implementing an [_exponetial backoff_](https://en.wikipedia.org/wiki/Exponential_backoff) algorithm to not overload the two parts in comunication.

It uses a well defined protocol in order to simplify the integration with other back ends (even if in different languages).

The client could be used in AngularJS, via provider, or in plain javascript.

Comunicator is developed by [720kb](http://720kb.net).

## Requirements

This implementation needs a browser that is:
- capable to instantiate [websockets](http://caniuse.com/#search=websocket), due the fact it wraps a websocket;
- has  [requestAnimationFrame](http://caniuse.com/#feat=requestanimationframe) ("_shimmed_" or not) for the exponential back off algorithm;
- has [Promise](http://caniuse.com/#feat=promises) ("_shimmed_" or not) because Comunicator client is a `Promise`.

The AngularJS provider need at least version 1.2.

## Installation

Comunicator could be installed via npm or bower

#### NPM
```sh
$ npm install --save comunicator
```
#### Bower
```sh
$ bower install --save comunicator
```

### Loading

#### Nodejs side
In nodejs you have to instantiate the comunicator requiring it and passing a _salt_ as showed here:
```javascript
var jwtSalt = '_super_secret_salt_12345'
  , comunicator = require('comunicator')(jwtSalt);
```
The salt is used in conjunction with [jwt](https://tools.ietf.org/html/rfc7519) to sign messages achieving integrity in what is sent.

By default the websocket is bound on `0.0.0.0:9876` address but it can be configured setting `COMUNICATOR_HOST` and `COMUNICATOR_PORT` to the preferred host and port.

For example:
- `COMUNICATOR_HOST='127.0.0.1'`;
- `COMUNICATOR_PORT=7546`:

##### API
The api exposed is:

- `broadcast(whoami, what)`: this sends `what` to everyone who is connected. The message is sent to the others with `whoami` as sender;

- `sendTo(whoami, who, what)`: this sends `what` to `who`. The message is sent to `who` with `whoami` as sender;

- `isUserPresent(who)`: checks if `who` is connected to comunicator.

Comunicator is also an `EventEmitter` and can emit these events:

- `comunicator:user-joined`: emitted when user fulfills the connection in comunicator. The event payload contains who joined;

- `comunicator:user-leave`: emitted when user close the comunicator connection. The event payload contains who leaves;

- `comunicator:message-arrived`: emitted when a message is arrived. The event payload contains the informations that describe the message itself:
```javascript
  {
    'whoami': <sender>,
    'who': <recipient | *>,
    'what': <message payload
  }
```
In _broadcast_-ed messages the recipient is `*` due the fact that the message is for all.

#### Client side
The files you need are:
- `dist/comunicator.min.js` for the plain javascript implementation;
- `dist/comunicator-angular.min.js` for the AngularJS provider.

If you are about to use the AngularJS provider you have to include the module that brings the provider, for example:

```js
angular.module('app', [
  '720kb.comunicator'
 ]);
```

### API

#### Plain javascript
`Comunicator` client is an `window` object. To use it you need to create an instance of it, for example:
```javascript
  var comunicator = new Comunicator(<backend comunicator url>);
```
This returns a `Promise` that is resolved when the client websocket is correctly connected to the websocket server.

The connection enstablishment is also notified by the `comunicator:ready` event dispatched by window.

##### Methods
The resolved object expose this methods:
- `whoAmI()`: returns the client identifier stored in comunicator;

- `userIsPresent(whoami, token)`: this sends to comunicator server who is the client and which jwt token will be used;

- `broadcast(what, managed)`: this sends to `what` to everyone who is connected;

- `sendTo(who, what, managed)`: this sends `what` to `who`;

- `exit()`: this disconnect the comunicator client.

As you can see `sendTo` and `broadcast` methods have the `managed` parameter. Comunicator server by default forward messages from client to client. If a client doesn't want this behaviour should call the method with a truthy value to `managed` parameter.

Comunicator client dispatchs also events from `window`; they are:
- `comunicator:ready`: dispatched when the comunicator is connected to websocket and ready for joining;

- `comunicator:joined`: dispatched when the comunicator client has finished the joining process;

- `comunicator:to-me`: dispatched when the comunicator client receives a directly sent message. The event payload contains the message informations:
```javascript
  {
    'detail': {
      'opcode': 'sent',
      'whoami': <sender>,
      'who': <recipient>,
      'what': <message payload>
    }
  }
```

- `comunicator:to-all`: dispatched when the comunicator client receives a broadcasted message. The event payload contains the message informations:
```javascript
  {
    'detail': {
      'opcode': 'broadcasted',
      'whoami': <sender>,
      'what': <message payload>
    }
  }
```
- `comunicator:closed`: dispatched when the comunicator client ends its disconnection process;

## Contributing

We will be much grateful if you help us making this project to grow up.
Feel free to contribute by forking, opening issues, pull requests etc.

## License

The MIT License (MIT)

Copyright (c) 2014 Dario Andrei, Filippo Oretti

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
