'use strict';

var _ = require('../basics');
var Data = require('../data');

var Node = Data.Node.extend({

  name: "node",

  attach: function(document) {
    this.document = document;
    this.didAttach(document);
  },

  detach: function() {
    var doc = this.document;
    this.document = null;
    this.didDetach(doc);
  },

  didAttach: function() {},

  didDetach: function() {},

  isAttached: function() {
    return this.document !== null;
  },

  getDocument: function() {
    return this.document;
  },

  hasParent: function() {
    return !!this.parent;
  },

  getParent: function() {
    return this.document.get(this.parent);
  },

  getRoot: function() {
    var node = this;
    while (node.hasParent()) {
      node = node.getParent();
    }
    return node;
  },

  getComponents: function() {
    var componentNames = this.constructor.static.components || [];
    if (componentNames.length === 0) {
      console.warn('Contract: a node must define its editable properties.', this.constructor.static.name);
    }
    return componentNames;
  },

  isExternal: function() {
    return this.constructor.static.external;
  },

  // Note: children are provided for inline nodes only.
  toHtml: function(converter, children) {
    return this.constructor.static.toHtml(this, converter, children);
  },

});

Node.initNodeClass = Data.Node.initNodeClass;

// default HTML serialization
Node.static.toHtml = function(node, converter) {
  var $el = $('<div itemscope>')
    .attr('data-id', node.id)
    .attr('data-type', node.type);
  _.each(node.properties, function(value, name) {
    var $prop = $('<div>').attr('itemprop', name);
    if (node.getPropertyType === 'string') {
      $prop[0].appendChild(converter.annotatedText([node.id, name]));
    } else {
      $prop.text(value);
    }
    $el.append($prop);
  });
  return $el;
};

Node.static.external = false;

module.exports = Node;
