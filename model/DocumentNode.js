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

  /**
    Get the Document instance.

    @returns {Document}
  */
  this.getDocument = function() {
    return this.document;
  };

  /**
    Whether this node has a parent.

    `parent` is a built-in property for implementing nested nodes.

    @returns {Boolean}
  */
  this.hasParent = function() {
    return !!this.parent;
  };

  /**
    @returns {DocumentNode} the parent node
  */
  this.getParent = function() {
    return this.document.get(this.parent);
  };

  /**
    Checks whether this node has children.

    @returns {Boolean} default: false
  */
  this.hasChildren = function() {
    return false;
  };

  /**
    Get the index of a given child.

    @returns {Number} default: -1
  */
  this.getChildIndex = function(child) {
    /* jshint unused:false */
    return -1;
  };

  /**
    Get a child node at a given position.

    @returns {DocumentNode} default: null
  */
  this.getChildAt = function(idx) {
    /* jshint unused:false */
    return null;
  };

  /**
    Get the number of children nodes.

    @returns {Number} default: 0
  */
  this.getChildCount = function() {
    return 0;
  };

  /**
    Get the root node.

    The root node is the last ancestor returned
    by a sequence of `getParent()` calls.

    @returns {DocumentNode}
  */
  this.getRoot = function() {
    var node = this;
    while (node.hasParent()) {
      node = node.getParent();
    }
    return node;
  };

  /**
    This is used to be able to traverse all properties in a container.
    This is particularly necessary for strucuted nodes, with more than one editable
    text property.

    @example

    For a figure node with `title`, `img`, and `caption` this could look
    be done this way:

    ```
    Figure.static.addressablePropertyNames = ['title', 'caption']
    ```

    The img itself does not need to be addressable, as it can't be edited in the text editor.

    Alternatvely you can use the `text` data type in the schema, which implicitly makes
    these properties addressable.

    ```
    Figure.static.defineSchema({
      title: "text",
      img: "string",
      caption: "text"
    });
    ```

    @private
    @returns {String[]} an array of property names
  */
  this.getAddressablePropertyNames = function() {
    var addressablePropertyNames = this.constructor.static.addressablePropertyNames;
    return addressablePropertyNames || [];
  };

  this.getPropertyNameAt = function(idx) {
    var propertyNames = this.constructor.static.addressablePropertyNames || [];
    return propertyNames[idx];
  };

  // TODO: should this really be here?
  // volatile property necessary to render highlighted node differently
  this.setHighlighted = function(highlighted) {
    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted;
      this.emit('highlighted', highlighted);
    }
  };

  // Experimental: we are working on a simpler API replacing the
  // rather inconvenient EventProxy API.
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
    @returns {Boolean} true if node is a block node (e.g. Paragraph, Figure, List, Table)
  */
  this.isBlock = function() {
    return this.constructor.static.isBlock;
  };

  /**
    @returns {Boolean} true if node is a text node (e.g. Paragraph, Codebock)
  */
  this.isText = function() {
    return this.constructor.static.isText;
  };

  /**
    @returns {Boolean} true if node is an annotation node (e.g. Strong)
  */
  this.isPropertyAnnotation = function() {
    return this.constructor.static.isPropertyAnnotation;
  };

  /**
    @returns {Boolean} true if node is an inline node (e.g. Citation)
  */
  this.isInline = function() {
    return this.constructor.static.isInline;
  };

  /**
    @returns {Boolean} true if node is a container annotation (e.g. multiparagraph comment)
  */
  this.isContainerAnnotation = function() {
    return this.constructor.static.isContainerAnnotation;
  };

};

DataNode.extend(DocumentNode);

/**
  The node's name is used to register it in the DocumentSchema.

  @type {String} default: 'node'
*/
DocumentNode.static.name = 'node';

/**
  Declares a node to be treated as block-type node.

  BlockNodes are considers the direct descendant of `Container` nodes.
  @type {Boolean} default: false
*/
DocumentNode.static.isBlock = false;

/**
  Declares a node to be treated as text-ish node.

  @type {Boolean} default: false
*/
DocumentNode.static.isText = false;

/**
  Declares a node to be treated as {@link model/PropertyAnnotation}.

  @type {Boolean} default: false
*/
DocumentNode.static.isPropertyAnnotation = false;

/**
  Declares a node to be treated as {@link model/ContainerAnnotation}.

  @type {Boolean} default: false
*/
DocumentNode.static.isContainerAnnotation = false;

/**
  Declares a node to be treated as {@link model/InlineNode}.

  @type {Boolean} default: false
*/
DocumentNode.static.isInline = false;

module.exports = DocumentNode;
