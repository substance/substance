'use strict';

var _ = require('../../basics/helpers');
var DocumentNode = require('../node');

var List = DocumentNode.extend({
  name: "list",
  properties: {
    ordered: "bool",
    items: ["array", "id"]
  },
  getItems: function() {
    var doc = this.getDocument();
    return _.map(this.items, function(id) {
      return doc.get(id);
    }, this);
  },
});

List.static.components = ['items'];

// HtmlImporter

List.static.blockType = true;

List.static.matchElement = function($el) {
  return $el.is('ul,ol');
};

List.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'list');
  var list = {
    id: id,
    ordered: false,
    items: []
  };
  if ($el.is('ol')) {
    list.ordered = true;
  }
  // Note: nested lists are not supported yet
  var level = 1;
  $el.children().each(function() {
    var $child = $(this);
    if ($child.is('li')) {
      var listItem = converter.convertElement($child, { parent: id, level: level });
      list.items.push(listItem.id);
    } else {
      converter.warning('List: unsupported child element. ' + converter.$toStr($child));
    }
  });
  return list;
};

List.static.toHtml = function(list, converter) {
  var tagName = list.ordered ? 'ol' : 'ul';
  var id = list.id;
  var $el = ('<' + tagName + '>')
    .attr('id', id);
  _.each(list.getItems(), function(item) {
    $el.append(item.toHtml(converter));
  });
  return $el;
};

Object.defineProperties(List.prototype, {
  itemNodes: {
    'get': function() {
      return this.getItems();
    }
  }
});

module.exports = List;
