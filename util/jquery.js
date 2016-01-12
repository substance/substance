var inBrowser = (typeof window !== 'undefined');
var $ = null;

if (inBrowser) {
  module.exports = require('jquery');
} else {
  if (!$) {
    var cheerio = require('cheerio');
    cheerio.prototype.prop = cheerio.prototype.attr;
    cheerio.prototype.removeProp = cheerio.prototype.removeAttr;
    cheerio.prototype.on = function() {};
    cheerio.prototype.off = function() {};
    $ = cheerio.load('', {decodeEntities: false});
    /*
       we need to be able to create native text nodes efficiently
       this code is taken from:
       https://github.com/cheeriojs/cheerio/blob/106e42a04e38f0d2c7c096d693be2f725c89dc85/lib/api/manipulation.js#L366
    */
    $._createTextNode = function(text) {
      return {
        data: text,
        type: 'text',
        parent: null,
        prev: null,
        next: null,
        children: []
      };
    };

    $.parseXML = function(str) {
      var parsed = $.load(str, {xmlMode: true});
      return parsed.root()[0].children.slice();
    };
  }
  module.exports = $;
}
