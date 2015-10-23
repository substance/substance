'use strict';

var Annotation = require('../../model/Annotation');

var Link = Annotation.extend({
  name: "link",
  displayName: "Link",
  properties: {
    url: 'string',
    title: 'string'
  }
});

// HtmlImporter

Link.static.tagName = 'a';

Link.static.matchElement = function($el) {
  return $el.is('a');
};

Link.static.fromHtml = function($el, converter) {
  var link = {
    url: $el.attr('href'),
    title: $el.attr('title')
  };
  // Note: we need to call back the converter
  // that it can process the element's inner html.
  // We do not need it for the link itself, though
  // TODO: maybe it is possible to detect if it has called back
  converter.annotatedText($el);
  return link;
};

Link.static.toHtml = function(link, converter, children) {
  var $el = Annotation.static.toHtml(link, converter, children);
  $el.attr('href', link.url);
  $el.attr('title', link.title);
  return $el;
};

module.exports = Link;
