'use strict';

var _ = require('../util/helpers');
var oo = require('../util/oo');
var DataNode = require('./data/Node');

function DocumentNode(doc, props) {
  DataNode.call(this, props);
  if (!doc) {
    throw new Error('Document instance is mandatory.');
  }
  this.document = doc;
}

DocumentNode.Prototype = function() {

  this.getDocument = function() {
    return this.document;
  };

  this.hasParent = function() {
    return !!this.parent;
  };

  this.getParent = function() {
    return this.document.get(this.parent);
  };

  this.hasChildren = function() {
    return false;
  };

  this.getChildIndex = function(child) {
    /* jshint unused:false */
    return -1;
  };

  this.getChildAt = function(idx) {
    /* jshint unused:false */
    return null;
  };

  this.getChildCount = function() {
    return 0;
  };

  this.getRoot = function() {
    var node = this;
    while (node.hasParent()) {
      node = node.getParent();
    }
    return node;
  };

  this.getComponents = function() {
    var componentNames = this.constructor.static.components;
    if (!componentNames) {
      console.warn('Contract: a node must define its editable properties.', this.constructor.static.name);
    }
    return componentNames || [];
  };

  this.getPropertyNameAt = function(idx) {
    var propertyNames = this.constructor.static.components || [];
    return propertyNames[idx];
  };

  // volatile property necessary to render highlighted node differently
  this.setHighlighted = function(highlighted) {
    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted;
      this.emit('highlighted', highlighted);
    }
  };

  this.isExternal = function() {
    return this.constructor.static.external;
  };

  this.connect = function(ctx, handlers) {
    _.each(handlers, function(func, name) {
      var match = /([a-zA-Z_0-9]+):changed/.exec(name);
      if (match) {
        var propertyName = match[1];
        if (this.constructor.static.schema[propertyName]) {
          this.getDocument().getEventProxy('path').add([this.id, propertyName], this, this._onPropertyChange.bind(this, propertyName));
        }
      }
    }, this);
    DataNode.prototype.connect.apply(this, arguments);
  };

  this.disconnect = function() {
    // TODO: right now do not unregister from the event proxy
    // when there is no property listener left
    // We would need to implement disconnect
    DataNode.prototype.disconnect.apply(this, arguments);
  };

  this._onPropertyChange = function(propertyName) {
    var args = [propertyName + ':changed']
      .concat(Array.prototype.slice.call(arguments, 1));
    this.emit.apply(this, args);
  };

};

oo.inherit(DocumentNode, DataNode);

DocumentNode.static.name = "node";

DocumentNode.static.external = false;

module.exports = DocumentNode;
