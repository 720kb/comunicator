# Comunicator 
<div style="text-align:center"><img src="http://720kb.github.io/media/comunicator/logo.svg" alt="logo"></div>

A way to enstablish a websocket connection between users using your application and your back end that, in a scenario where on of between the client or the server goes offline, it enques unsent message waiting for reconnection; this is done implementing an [_exponetial backoff_](https://en.wikipedia.org/wiki/Exponential_backoff) algorithm to not overload the two part in comunication.

It use a well defined protocol so it can be possible to integrate with also with other back ends implemented without nodejs.

Could be use in AngularJS, via a provider, or in a plain javascript.

The Comunicator is developed by [720kb](http://720kb.net).

## Requirements

This implementation, due the fact it wraps a websocket, needs a browser capable to instantiate [websockets](http://caniuse.com/#search=websocket) and also [requestAnimationFrame](http://caniuse.com/#feat=requestanimationframe) ("_shimmed_" or not) for the exponential back off algorithm.

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

#### Client side
The files you need are `dist/comunicator.min.js` for the plain javascript implementation, `dist/comunicator-angular.min.js` for the AngularJS provider.
In case you using the AngularJS provider you have to include the module that brings the provider; for example:

```js
angular.module('app', [
  '720kb.comunicator'
 ]);
```

### API




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
