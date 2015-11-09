/* jshint latedef:false */
var commonmark = require('commonmark');
var reader = new commonmark.Parser();
var highlightjs = require('highlight.js');
var writer = new commonmark.HtmlRenderer();

var converter = {
  toHtml: function(text) {
    var parsed = reader.parse(text);
    highlightCodeblocks(parsed);
    return writer.render(parsed);
  }
};

function highlightCodeblocks(parsed) {
  var walker = parsed.walker();
  var event, node;
  while ((event = walker.next())) {
    node = event.node;
    if (node.type === 'CodeBlock') {
      var info = node.info ? node.info.split(/\s+/) : [];
      var lang = info[0];
      var highlighted;
      var classes = ['hljs'];

      if (lang) {
        highlighted = highlightjs.highlight(lang, node.literal).value;
        classes.push('lang-'+lang);
      } else {
        highlighted = highlightjs.highlightAuto(node.literal).value;
      }

      var htmlBlock = new commonmark.Node('HtmlBlock', node.sourcepos);
      htmlBlock.literal = ['<pre>', '<code class="'+classes.join(' ')+'">', highlighted, '</code>', '<pre>'].join('');
      node.insertBefore(htmlBlock);
      node.unlink();
    }
  }
}
module.exports = converter;
