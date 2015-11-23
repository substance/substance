'use strict';

var each = require('lodash/collection/each');
var DataNode = require('./data/Node');

/**
  Base node type for document nodes.

  @class
  @abstract

  @param {model/Document} doc A document instance
  @param {object} node properties
*/

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

  this.getAddressablePropertyNames = function() {
    var addressablePropertyNames = this.constructor.static.addressablePropertyNames;
    return addressablePropertyNames || [];
  };

  this.getPropertyNameAt = function(idx) {
    var propertyNames = this.constructor.static.addressablePropertyNames || [];
    return propertyNames[idx];
  };

  // volatile property necessary to render highlighted node differently
  this.setHighlighted = function(highlighted) {
    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted;
      this.emit('highlighted', highlighted);
    }
  };

  this.connect = function(ctx, handlers) {
    each(handlers, function(func, name) {
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

  // Node categories
  // --------------------

  /**
    Returns true if node is a block node (e.g. Paragraph, Figure, List, Table)
  */
  this.isBlock = function() {
    return this.constructor.static.isBlock;
  };

  /**
    Returns true if node is a text node (e.g. Paragraph, Codebock)
  */
  this.isText = function() {
    return this.constructor.static.isText;
  };

  /**
    Returns true if node is an annotation node (e.g. Strong)
  */
  this.isPropertyAnnotation = function() {
    return this.constructor.static.isPropertyAnnotation;
  };

  /**
    Returns true if node is an inline node (e.g. Citation)
  */
  this.isInline = function() {
    return this.constructor.static.isInline;
  };

  /**
    Returns true if node is a container annotation (e.g. multiparagraph comment)
  */
  this.isContainerAnnotation = function() {
    return this.constructor.static.isContainerAnnotation;
  };

};

DataNode.extend(DocumentNode);

DocumentNode.static.name = 'node';
DocumentNode.static.isBlock = false;
DocumentNode.static.isText = false;
DocumentNode.static.isPropertyAnnotation = false;
DocumentNode.static.isContainerAnnotation = false;
DocumentNode.static.isInline = false;


module.exports = DocumentNode;
