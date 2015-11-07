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

var markedOptions = {
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: function (code) {
    return highlightjs.highlightAuto(code).value;
  },
};

module.exports = markedOptions;
