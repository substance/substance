var markdown = require('marked');
var highlightjs = require('highlight.js');

var renderer = new markdown.Renderer();
renderer.heading = function (text, level) {
  return '<h' + level + '>' + text + '</h' + level + '>\n';
};
renderer.paragraph = function (text) {
  return '<p>' + text + '</p>';
};
renderer.br = function () {
  return '<br />';
};

renderer.code = function(code, lang){
  var html;
  if (lang) {
    html = highlightjs.highlight(lang, code).value;
  } else {
    html = highlightjs.highlightAuto(code).value;
  }
  return [
    '<pre><code class="hljs lang-'+lang+'">',
      html,
    '</code></pre>'
  ].join('');
};

var markedOptions = {
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
};

module.exports = markedOptions;
