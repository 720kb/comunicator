/*global window*/
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function rafPolyfill(window) {
  'use strict';

  var lastTime = 0
    , vendors = ['ms', 'moz', 'webkit', 'o']
    , x = 0;

  for (; x < vendors.length && !window.requestAnimationFrame; x += 1) {

    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {

    window.requestAnimationFrame = function rafPolyfill(callback) {
      var currTime = new Date().getTime()
        , timeToCall = Math.max(0, 16 - (currTime - lastTime))
        , id = window.setTimeout(function endTimeOut() {
            callback(currTime + timeToCall);
          }, timeToCall);

      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {

    window.cancelAnimationFrame = function cafPolyfill(id) {
      window.clearTimeout(id);
    };
  }
}(window));
