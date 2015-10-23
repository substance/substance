var Substance = require('substance');
var $ = require('substance/basics/jquery');

var Image = Substance.Document.Node.extend({
  name: "image",
  properties: {
    "src": "string",
    "previewSrc": "string"
  }
});

// HtmlImporter

Image.static.matchElement = function($el) {
  return $el.is("img");
};

Image.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'img');
  var image = {
    id: id,
    src: $el.attr('src'),
    previewSrc: $el.attr('data-preview-src'),
  };

  return image;
};

// HtmlExporter

Image.static.toHtml = function(image, converter) {
  var $el = $('<img>')
    .attr('id', image.id)
    .attr('src', image.src)
    .attr('data-preview-src', image.previewSrc);
  return $el;
};

module.exports = Image;
