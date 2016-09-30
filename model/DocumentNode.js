import each from 'lodash/each'
import DataNode from './data/Node'
import EventEmitter from '../util/EventEmitter'

/**
  Base node type for document nodes.

  @class
  @abstract

  @param {model/Document} doc A document instance
  @param {object} node properties
  @example

  The following example shows how a new node type is defined.


  ```js
  class Todo extends TextBlock {}
  Todo.define({
    type: 'todo',
    content: 'text',
    done: { type: 'bool', default: false }
  })
  ```

  The following
    data types are supported:

      - `string` bare metal string data type
      - `text` a string that carries annotations
      - `number` numeric values
      - `bool` boolean values
      - 'id' a node id referencing another node in the document
*/

class DocumentNode extends DataNode {

  constructor(doc, props) {
    super(props)
    // being less strict here allows us to create a detached node
    // which can be useful for testing
    // if (!doc) throw new Error('Document instance is mandatory.')
    this.document = doc
  }

  get _isDocumentNode() { return true }

  /**
    Get the Document instance.

    @returns {Document}
  */
  getDocument() {
    return this.document
  }

  /**
    Whether this node has a parent.

    `parent` is a built-in property for implementing nested nodes.

    @returns {Boolean}
  */
  hasParent() {
    return Boolean(this.parent)
  }

  /**
    @returns {DocumentNode} the parent node
  */
  getParent() {
    return this.document.get(this.parent)
  }

  /**
    Checks whether this node has children.

    @returns {Boolean} default: false
  */
  hasChildren() {
    return false
  }

  /**
    Get the index of a given child.

    @returns {Number} default: -1
  */
  getChildIndex(child) { // eslint-disable-line
    return -1
  }

  /**
    Get a child node at a given position.

    @returns {DocumentNode} default: null
  */
  getChildAt(idx) { // eslint-disable-line
    return null
  }

  /**
    Get the number of children nodes.

    @returns {Number} default: 0
  */
  getChildCount() {
    return 0
  }

  /**
    Get the root node.

    The root node is the last ancestor returned
    by a sequence of `getParent()` calls.

    @returns {DocumentNode}
  */
  getRoot() {
    var node = this
    while (node.hasParent()) {
      node = node.getParent()
    }
    return node
  }

  // TODO: should this really be here?
  // volatile property necessary to render highlighted node differently
  // TODO: We should get this out here
  setHighlighted(highlighted, scope) {
    if (this.highlighted !== highlighted) {
      this.highlightedScope = scope
      this.highlighted = highlighted
      this.emit('highlighted', highlighted)
    }
  }

  on(eventName, handler, ctx) {
    var match = _matchPropertyEvent(eventName)
    if (match) {
      var propertyName = match[1]
      if (this.constructor.schema[propertyName]) {
        var doc = this.getDocument()
        doc.getEventProxy('path')
          .on([this.id, propertyName], handler, ctx)
      }
    }
    EventEmitter.prototype.on.apply(this, arguments)
  }

  off(ctx, eventName, handler) {
    var doc = this.getDocument()
    var match = false
    if (!eventName) {
      doc.getEventProxy('path').off(ctx)
    } else {
      match = _matchPropertyEvent(eventName)
    }
    if (match) {
      var propertyName = match[1]
      doc.getEventProxy('path')
        .off(ctx, [this.id, propertyName], handler)
    }
    EventEmitter.prototype.off.apply(this, arguments)
  }

  // Experimental: we are working on a simpler API replacing the
  // rather inconvenient EventProxy API.
  connect(ctx, handlers) {
    console.warn('DEPRECATED: use Node.on() instead')
    each(handlers, function(func, name) {
      this.on(name, func, ctx)
    }.bind(this))
  }

  disconnect(ctx) {
    console.warn('DEPRECATED: use Node.off() instead')
    this.off(ctx)
  }

  _onPropertyChange(propertyName) {
    var args = [propertyName + ':changed']
      .concat(Array.prototype.slice.call(arguments, 1))
    this.emit.apply(this, args)
  }

  // Node categories
  // --------------------

  /**
    @returns {Boolean} true if node is a block node (e.g. Paragraph, Figure, List, Table)
  */
  isBlock() {
    return this.constructor.isBlock
  }

  /**
    @returns {Boolean} true if node is a text node (e.g. Paragraph, Codebock)
  */
  isText() {
    return this.constructor.isText
  }

  /**
    @returns {Boolean} true if node is an annotation node (e.g. Strong)
  */
  isPropertyAnnotation() {
    return this.constructor.isPropertyAnnotation
  }

  /**
    @returns {Boolean} true if node is an inline node (e.g. Citation)
  */
  isInline() {
    return this.constructor.isInline
  }

  /**
    @returns {Boolean} true if node is a container annotation (e.g. multiparagraph comment)
  */
  isContainerAnnotation() {
    return this.constructor.isContainerAnnotation
  }

}

/**
  Declares a node to be treated as block-type node.

  BlockNodes are considers the direct descendant of `Container` nodes.
  @type {Boolean} default: false
*/
DocumentNode.isBlock = false

/**
  Declares a node to be treated as text-ish node.

  @type {Boolean} default: false
*/
DocumentNode.isText = false

/**
  Declares a node to be treated as {@link model/PropertyAnnotation}.

  @type {Boolean} default: false
*/
DocumentNode.isPropertyAnnotation = false

/**
  Declares a node to be treated as {@link model/ContainerAnnotation}.

  @type {Boolean} default: false
*/
DocumentNode.isContainerAnnotation = false

/**
  Declares a node to be treated as {@link model/InlineNode}.

  @type {Boolean} default: false
*/
DocumentNode.isInline = false

function _matchPropertyEvent(eventName) {
  return /([a-zA-Z_0-9]+):changed/.exec(eventName)
}

export default DocumentNode
