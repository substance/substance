var oo = require('../../util/oo');
var commonmark = require('commonmark');
var reader = new commonmark.Parser();
var highlightjs = require('highlight.js');

function HtmlRenderer() {
  commonmark.HtmlRenderer.apply(this, arguments);
}

HtmlRenderer.Prototype = function() {
  this.codeblock = function(node, attrs) {
    var classes = ['hljs'];
    var info_words = node.info ? node.info.split(/\s+/) : [];
    var lang;
    if (info_words.length > 0 && info_words[0].length > 0) {
      lang = this.escape(info_words[0], true);
      classes.push('language-' + lang);
    }
    attrs.push(['class', classes.join(' ')]);
    this.cr();
    // this.out(this.tag('pre') + this.tag('code', attrs));
    // this.out(this.escape(node.literal, false));
    // this.out(this.tag('/code') + this.tag('/pre'));

    // code highlighting
    var code = highlightjs.highlightAuto(node.literal).value;

    var codeblock = [
      this.tag('pre') + this.tag('code', attrs),
      // this.escape(code, false),
      code,
      this.tag('/code') + this.tag('/pre')
    ].join('');

    this.out(codeblock);
    this.cr();
  };
};

oo.inherit(HtmlRenderer, commonmark.HtmlRenderer);

var writer = new HtmlRenderer();

var converter = {
  toHtml: function(text) {
    var parsed = reader.parse(text);
    return writer.render(parsed);
  }
};

module.exports = converter;
