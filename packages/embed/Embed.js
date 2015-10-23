'use strict';

var $ = require('../../util/jquery');
var DocumentNode = require('../../model/DocumentNode');

var Embed = DocumentNode.extend({
  displayName: "Embed",
  name: "embed",
  properties: {
    src: 'string',
    html: 'string' // Generated HTML
  }
});

// HtmlImporter

Embed.static.blockType = true;

Embed.static.matchElement = function($el) {
  return $el.is('embed');
};

Embed.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'embed');
  var embed = {
    id: id,
    src: $el.attr('src'),
    html: $el.html()
  };
  return embed;
};

// HtmlExporter

Embed.static.toHtml = function(embed, converter) {
  /* jshint unused: false */
  var $el = $('<embed>')
    .attr('id', embed.id)
    .attr('src', embed.src);
  $el.html(embed.html);
  return $el;
};

module.exports = Embed;
