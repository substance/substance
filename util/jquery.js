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

    $._createElement = function(tagName, root) {
      return {
        type: "tag",
        name: tagName,
        attribs: {},
        children: [],
        parent: null,
        root: root,
        options: root.options,
        next: null,
        prev: null
      };
    };

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

    var parseMarkup = function(str, options) {
      var parsed = $.load(str, options);
      var root = parsed.root()[0];
      if (!root.options) {
        root.options = options;
      }
      return root.children.slice();
    };

    $.parseHTML = function(str) {
      return parseMarkup(str, { xmlMode: false });
    };

    $.parseXML = function(str) {
      return parseMarkup(str, { xmlMode: true });
    };

    $._serialize = function(el) {
      var serialize = require('dom-serializer');
      var opts = el.options || el.root.options;
      return serialize(el, opts);
    };
  }
  module.exports = $;
}
