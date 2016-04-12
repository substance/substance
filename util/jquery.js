'use strict';

var inBrowser = require('./inBrowser');

if (inBrowser) {
  module.exports = require('jquery');
} else {
  module.exports = require('./cheerio.customized.js');
}
