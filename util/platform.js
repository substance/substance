
/**
  @module

  Platform utilities such as browser detection etc.

  @example

  ```js
  var platform = require('substance/util/platform');
  ```
*/
var platform = {
  /**
    True if user agent is Internet Explorer or Microsoft Edge.
  */
  isIE: false,
  /**
    True if user agent is Firefox
  */
  isFF: false
};

if (typeof window !== 'undefined') {
  // Detect Internet Explorer / Edge
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');
  var trident = ua.indexOf('Trident/');
  var edge = ua.indexOf('Edge/');

  if (msie > 0) {
      // IE 10 or older => return version number
      platform.isIE = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  } else if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf('rv:');
      platform.isIE = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  } else if (edge > 0) {
     // IE 12 => return version number
     platform.isIE = parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }

  // Detect Firefox
  platform.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

module.exports = platform;