'use strict';

var commonmark = require('commonmark');
var reader = new commonmark.Parser();
var highlightjs = require('highlight.js');
var writer = new commonmark.HtmlRenderer();
var CrossLinkComponent = require('../components/CrossLinkComponent');

var converter = {
  toHtml: function(text) {
    var parsed = reader.parse(text);
    highlightCodeblocks(parsed);
    makeLinksExternal(parsed);
    convertCodeLinks(parsed);
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
      htmlBlock.literal = ['<pre>', '<code class="'+classes.join(' ')+'">', highlighted, '</code>', '</pre>'].join('');
      node.insertBefore(htmlBlock);
      node.unlink();
    }
  }
}

function makeLinksExternal(parsed) {
  var walker = parsed.walker();
  var event, node;
  while ((event = walker.next())) {
    node = event.node;
    if (event.entering && node.type === 'Link') {
      var href = node.destination;
      var text = href;
      if (node.firstChild) {
        text = node.firstChild.literal;
      }
      var el = new commonmark.Node('Html');
      el.literal = ['<a href="', href, '" target="_blank">', text, '</a>'].join('');
      node.insertBefore(el);
      node.unlink();
    }
  }
}

function convertCodeLinks(parsed) {
  var walker = parsed.walker();
  var event, node;
  var sourceposPre, sourceposLink, sourceposPost;
  while ((event = walker.next())) {
    node = event.node;
    if (node.type === 'Text') {
      var re = /(\{\s*@link([^\}]*)\})/;
      var match = re.exec(node.literal);
      while (match) {
        sourceposPre = undefined;
        sourceposLink = undefined;
        sourceposPost = undefined;
        if (node.sourcepos) {
          var startLine = node.sourcepos[0][0];
          var startCol = node.sourcepos[0][1];
          var matchStart = startCol+match.index;
          var matchEnd = matchStart+match[0].length;
          sourceposPre = [node.sourcepos[0], [startLine, matchStart]];
          sourceposLink = [[startLine, matchStart], [startLine, matchEnd]];
          sourceposPost = [[startLine, matchEnd], node.sourcepos[1]];
        }
        var id = match[2].trim();
        var pre = new commonmark.Node('Text', sourceposPre);
        pre.literal = node.literal.slice(0, match.index);
        var link = new commonmark.Node('Html', sourceposLink);
        // Note: using server-side rendering here
        var crossLink = CrossLinkComponent.static.render({ node: { id: id }, children: [id]});
        link.literal = crossLink.outerHTML;
        var post = new commonmark.Node('Text', sourceposPost);
        post.literal = node.literal.slice(match.index+match[0].length);
        node.insertBefore(pre);
        node.insertBefore(link);
        node.insertBefore(post);
        node.unlink();

        // iterating to find all matches
        node = post;
        match = re.exec(post.literal);
      }
    }
  }
}

module.exports = converter;
