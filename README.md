# Comunicator
##### A way to enstablish a websocket connection between users, using your application and your back end.

<div style="text-align:center"><img src="http://720kb.github.io/media/comunicator/logo.svg" alt="logo"></div>
Additionally it reacts to the scenario where either client or server goes offline, enqueing unsent messages waiting for reconnection; this is done implementing an [_exponetial backoff_](https://en.wikipedia.org/wiki/Exponential_backoff) algorithm to not overload the two parts in comunication.

It uses a well defined protocol in order to simplify the integration with other back ends (even if in different languages).

The client could be used in AngularJS, via provider, or in plain javascript.

Comunicator is developed by [720kb](http://720kb.net).

## Requirements and Dependencies

This implementation needs a browser that is capable to instantiate [websockets](http://caniuse.com/#search=websocket), due to the fact that it wraps a websocket.

The comunicator is an [Observable](https://zenparsing.github.io/es-observable) and uses the [RxJs](https://github.com/ReactiveX/RxJS) implementation.

The AngularJS provider needs at least AngularJS version 1.2.

## Installation

Comunicator could be installed via npm or bower:

#### NPM
```sh
$ npm install --save comunicator
```
#### Bower
```sh
$ bower install --save comunicator
```

### Node.js side
In node.js you have to instantiate Comunicator passing a websocket configuration object and a _jwtSalt_ as showed here:
```javascript
const jwtSalt = '_super_secret_salt_12345'
  , Comunicator = require('comunicator').Comunicator
  , theComunicator = new Comunicator({
    'host': '::',
    'port': 3000
  }, jwtSalt);
```

The websocket configuration object refers to the options passed to [ws.Server](https://github.com/websockets/ws/blob/master/doc/ws.md#new-wsserveroptions-callback) constructor.

The methods exposed are:

- `broadcast(whoami, what)`: this sends `what` to everyone who is connected. The message is sent to the others with `whoami` as sender;

- `sendTo(whoami, who, what)`: this sends `what` to `who`. The message is sent to `who` with `whoami` as sender;

- `isUserPresent(who)`: checks if `who` is connected to Comunicator.

A subscriber to the comunicator could receive:

- ```javascript
{
  'type': 'ready'
}
```
When the underlined websocket is instantiated;

- ```javascript
{
  'type': 'open',
  'whoami': <a_websocket>
}
```
When a user is conneced to the server;

- ```javascript
{
  'type': 'user-leave',
  'whoami': <the_user_identifier>
}
```
When a user closes the Comunicator connection;

- ```javascript
{
  'type': 'user-joined',
  'whoami': <the_user_identifier>
}
```
When a user fulfills the connection in Comunicator;

- ```javascript
{
  'type': 'no-pending-messages',
  'whoami': <the_user_identifier>
}
```
When there aren't messages for the identified user;

- ```javascript
{
  'type': 'message-arrived',
  'whoami': <sender>,  
  'who': <recipient | *>,
  'what': <message payload>
}
```
When a message is arrived.

In _broadcast_-ed messages the recipient is `*` due to the fact that the message is for everyone;

### Client side
The files you need are:
- `dist/frontend/comunicator-min.js` for the plain javascript implementation;
- `dist/frontend/angular-comunicator-min.js` for the AngularJS implementation.

There are also the not minified versions available in the same folder (without `min`).

If you are about to use the AngularJS provider you have to include the module that brings the provider, for example:

```js
angular.module('app', [
  '720kb.comunicator'
 ]);
```

#### Plain javascript
Comunicator client is an UMD module (it can be used also in node.js programs). After you load the comunicator file with what you prefer (SystemJS, RequireJs, Browserify, ...) to use it you need to create an instance of comunicator, for example:
```javascript
  const comunicator = new Comunicator(<backend comunicator url>);
```
or
```javascript
  const comunicator = new Comunicator(<an already instantiated websocket>);
```

The comunicator client object expose this methods:

- `userIsPresent(whoami, token)`: this sends to comunicator server who the client is and which jwt token will be used;

- `broadcast(what, managed)`: this sends `what` to everyone who is connected;

- `sendTo(who, what, managed)`: this sends `what` to `who`.

and also have the `whoAmI` property that returns the client identifier stored in comunicator client.

As you can see `sendTo` and `broadcast` methods have the `managed` parameter. Comunicator server forwards messages from client to client by default. If a client doesn't want this behaviour, should call the method with a truthy value to `managed` parameter.

A subscriber to the comunicator client could receive:

- ```javascript
{
  'type': 'open',
  'whoami': <websocket_opened>
}
```
When the underlined comunicator websocket is opened;

- ```javascript
{
  'type': 'joined',
  'whoami': <the_user_identifier>
}
```
When the comunicator client has finished the joining process;

- ```javascript
{
  'type': 'to-me',
  'whoami': <sender>,
  'who': <recipient>,
  'what': <message payload>
}
```
When the comunicator client receives a directly sent message.

- ```javascript
{
  'type': 'to-all',
  'whoami': <sender>,
  'what': <message payload>
}
```
When the comunicator client receives a broadcasted message.

#### AngularJS

The provider exposes the `setComunicatorServerURL(<backend comunicator url>|<already instantiated websocket>)` that must be called to instantiate and configure the Comunicator object.

Done that, the Comunicator object is available via the provider. Please note that you need to run `$scope.$apply()` method to update your view after a reaction from comunicator.

## Contributing

We will be very grateful if you help us making this project grow up.
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
