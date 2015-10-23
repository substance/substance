var Substance = require('substance');
var $ = Substance.$;

// Abstract interface
// There are ImageFigures, TableFigures, VideoFigures

var Figure = Substance.Document.Node.extend({
  name: "figure",
  properties: {
    "title": "string",
    "caption": "string",
    "content": "id"
  },

  setLabel: function(label) {
    this.label = label;
    this.emit('label', label);
  },

  // Set compiled text representation
  // E.g. useful for print output
  setText: function(compiledText) {
    this.text = compiledText;
  },

  // For compatibility with Collection interface
  didInitialize: function() {
    this.guid = this.id;
  },

  getContentNode: function() {
    return this.document.get(this.content);
  },

});

// declare editable components, so that we can enable ContainerEditor features
Figure.static.components = ['title', 'caption'];

// HtmlImporter

Figure.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'fig');
  var figure = {
    id: id,
    title: "",
    caption: ""
  };

  $el.children().each(function() {
    var $child = $(this);
    var tagName = $child[0].tagName.toLowerCase();
    switch(tagName) {
      case 'title':
      case 'caption':
        figure[tagName] = converter.annotatedText($child, [id, tagName]);
        break;
    }
  });

  return figure;
};

// HtmlExporter

Figure.static.toHtml = function(tagName, figure, converter) {
  var id = figure.id;
  var $el = $('<'+tagName+'>')
    .attr('id', id);

  var $title = $('<title>')
    .append(converter.annotatedText([id, 'title']));

  var $content = figure.getContentNode().toHtml(converter);

  var $caption = $('<caption>')
    .append(converter.annotatedText([id, 'caption']));

  return $el.append($title, $content, $caption);
};

module.exports = Figure;
