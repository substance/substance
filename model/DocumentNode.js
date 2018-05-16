import DataNode from './Node'
import isString from '../util/isString'

/**
  Base node type for document nodes.

  @example

  The following example shows how a new node type is defined.

  ```js
  class Todo extends TextBlock {}
  Todo.schema = {
    type: 'todo',
    content: 'text',
    done: { type: 'bool', default: false }
  }
  ```

  The following data types are supported:

  - `string` bare metal string data type
  - `text` a string that carries annotations
  - `number` numeric values
  - `bool` boolean values
  - `id` a node id referencing another node in the document
*/
export default
class DocumentNode extends DataNode {
  _initialize (doc, props) {
    this.document = doc
    super._initialize(props)
  }

  /**
    Get the Document instance.

    @returns {Document}
  */
  getDocument () {
    return this.document
  }

  /**
    Whether this node has a parent.

    `parent` is a built-in property for implementing nested nodes.

    @returns {Boolean}
  */
  hasParent () {
    return Boolean(this.parent)
  }

  /**
    @returns {DocumentNode} the parent node
  */
  getParent () {
    if (isString(this.parent)) return this.document.get(this.parent)
    return this.parent
  }

  /**
    Get the root node.

    The root node is the last ancestor returned
    by a sequence of `getParent()` calls.

    @returns {DocumentNode}
  */
  getRoot () {
    let node = this
    while (node.parent) {
      node = node.parent
    }
    return node
  }

  getContainerRoot () {
    let node = this
    while (node.parent) {
      // stop if node is immediate child of a container
      if (node.parent.isContainer()) return node
      // oherwise traverse up
      node = node.parent
    }
    return node
  }

  /**
    Checks whether this node has children.

    @returns {Boolean} default: false
  */
  hasChildren () {
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
  getChildCount () {
    return 0
  }

  // Node categories
  // --------------------

  // TODO: we should use the same approach everywhere, either as prototype property or as class property

  /**
    @returns {Boolean} true if node is a block node (e.g. Paragraph, Figure, List, Table)
  */
  isBlock () {
    return Boolean(this.constructor.isBlock)
  }

  /**
    @returns {Boolean} true if node is a text node (e.g. Paragraph, Codebock)
  */
  isText () {
    return Boolean(this.constructor.isText)
  }

  isList () {
    return Boolean(this.constructor.isList)
  }

  isListItem () {
    return Boolean(this.constructor.isListItem)
  }

  isContainer () {
    return Boolean(this._isContainer)
  }

  // annotation categories

  isAnnotation () {
    return Boolean(this._isAnnotation)
  }

  isPropertyAnnotation () {
    return Boolean(this._isPropertyAnnotation)
  }

  isContainerAnnotation () {
    return Boolean(this._isContainerAnnotation)
  }

  /**
    @returns {Boolean} true if node is an inline node (e.g. Citation)
  */
  isInline () {
    return Boolean(this.constructor.isInline)
  }
}

DocumentNode.prototype._isDocumentNode = true

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
