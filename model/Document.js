import isEqual from '../util/isEqual'
import isNil from '../util/isNil'
import isPlainObject from '../util/isPlainObject'
import forEach from '../util/forEach'
import last from '../util/last'
import uuid from '../util/uuid'
import EventEmitter from '../util/EventEmitter'
import PropertyIndex from './PropertyIndex'
import AnnotationIndex from './AnnotationIndex'
import ContainerAnnotationIndex from './ContainerAnnotationIndex'
import DocumentChange from './DocumentChange'
import IncrementalData from './IncrementalData'
import DocumentNodeFactory from './DocumentNodeFactory'
import EditingInterface from './EditingInterface'
import Selection from './Selection'
import PropertySelection from './PropertySelection'
import ContainerSelection from './ContainerSelection'
import NodeSelection from './NodeSelection'
import CustomSelection from './CustomSelection'
import Coordinate from './Coordinate'
import { createNodeSelection } from './selectionHelpers'
import JSONConverter from './JSONConverter'
import ParentNodeHook from './ParentNodeHook'
import { SNIPPET_ID, getContainerRoot, compareCoordinates } from './documentHelpers'
import { transformDocumentChange } from './operationHelpers'

const converter = new JSONConverter()

/**
  Basic implementation of a Document.

  @example

  ```js
  import { Document } from 'substance'

  class MyArticle extends Document {
    constructor(...args) {
      super(...args)

      this.addIndex('foo', FooIndex)
    }
  }
  ```
*/

export default class Document extends EventEmitter {
  /**
    @param {DocumentSchema} schema The document schema.
  */
  constructor (schema, ...args) {
    super()

    this.schema = schema
    /* istanbul ignore next */
    if (!schema) {
      throw new Error('A document needs a schema for reflection.')
    }

    // used internally (-> Transaction)
    this._ops = []

    this._initialize(...args)
  }

  _initialize () {
    this.__id__ = uuid()
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(this.schema, this.nodeFactory)
    // all by type
    this.addIndex('type', new PropertyIndex('type'))
    // special index for (property-scoped) annotations
    this.addIndex('annotations', new AnnotationIndex())
    // TODO: these are only necessary if there is a container annotation
    // in the schema
    // special index for (container-scoped) annotations
    this.addIndex('container-annotations', new ContainerAnnotationIndex())
    // TODO: maybe we want to have a generalized concept for such low-level hooks
    // e.g. indexes are similar
    ParentNodeHook.register(this)
  }

  dispose () {
    this.off()
    this.data.off()
  }

  get id () {
    return this.__id__
  }

  /**
    @returns {model/DocumentSchema} the document's schema.
  */
  getSchema () {
    return this.schema
  }

  /**
    Check if this storage contains a node with given id.

    @returns {Boolean} `true` if a node with id exists, `false` otherwise.
  */
  contains (id) {
    return this.data.contains(id)
  }

  /**
    Get a node or value via path.

    @param {String|String[]} path node id or path to property.
    @returns {DocumentNode|any|undefined} a Node instance, a value or undefined if not found.
  */
  get (path, strict) {
    return this.data.get(path, strict)
  }

  resolve (path, strict) {
    let prop = this.getProperty(path)
    if (!prop) {
      if (strict) {
        throw new Error('Invalid path')
      } else {
        return undefined
      }
    }
    let val = this.get(path, strict)
    if (prop.isReference()) {
      if (prop.isArray()) {
        return val.map(id => this.get(id))
      } else {
        return this.get(val)
      }
    } else {
      return val
    }
  }

  /**
    @return {Object} A hash of {@link model/DocumentNode} instances.
  */
  getNodes () {
    return this.data.getNodes()
  }

  getAnnotations (path) {
    return this.getIndex('annotations').get(path)
  }
  /**
   * Retrieve the NodeProperty for a given path
   *
   * @param {string[]} path
   */
  getProperty (path) {
    if (path.length !== 2) {
      throw new Error('path must have length=2')
    }
    let [nodeId, propName] = path
    let node = this.get(nodeId)
    if (node) {
      return node.getSchema().getProperty(propName)
    } else {
      throw new Error('Invalid path.')
    }
  }

  /**
    Creates a context like a transaction for importing nodes.
    This is important in presence of cyclic dependencies.
    Indexes will not be updated during the import but will afterwards
    when all nodes have been created.

    @private
    This is experimental.

    @example

    Consider the following example from our documentation generator:
    We want to have a member index, which keeps track of members of namespaces, modules, and classes.
    grouped by type, and in the case of classes, also grouped by 'instance' and 'class'.

    ```
    ui
      - class
        - ui/Component
    ui/Component
      - class
        - method
          - mount
      - instance
        - method
          - render
    ```

    To decide which grouping to apply, the parent type of a member needs to be considered.
    Using an incremental approach, this leads to the problem, that the parent must exist
    before the child. At the same time, e.g. when deserializing, the parent has already
    a field with all children ids. This cyclic dependency is best address, by turning
    off all listeners (such as indexes) until the data is consistent.

  */
  import (importer) {
    try {
      this.data._stopIndexing()
      importer(this)
      this.data._startIndexing()
    } finally {
      this.data.queue = []
      this.data._startIndexing()
    }
  }

  /**
    Create a node from the given data.

    @param {Object} plain node data.
    @return {DocumentNode} The created node.

    @example

    ```js
    editorSession.transaction((tx) => {
      tx.create({
        id: 'p1',
        type: 'paragraph',
        content: 'Hi I am a Substance paragraph.'
      })
    })
    ```
  */
  create (nodeData) {
    if (!nodeData.id) {
      nodeData.id = uuid(nodeData.type)
    }
    if (!nodeData.type) {
      throw new Error('No node type provided')
    }
    const op = this._create(nodeData)
    if (op) {
      this._ops.push(op)
      if (!this._isTransactionDocument) {
        this._emitChange(op)
      }
      return this.get(nodeData.id)
    }
  }

  createDefaultTextNode (text, dir) {
    return this.create({
      type: this.getSchema().getDefaultTextType(),
      content: text || '',
      direction: dir
    })
  }

  /**
    Delete the node with given id.

    @param {String} nodeId
    @returns {DocumentNode} The deleted node.

    @example

    ```js
    doc.transaction(function(tx) {
      tx.delete('p1')
    })
    ```
  */
  delete (nodeId) {
    const node = this.get(nodeId)
    const op = this._delete(nodeId)
    if (op) {
      this._ops.push(op)
      if (!this._isTransactionDocument) {
        this._emitChange(op)
      }
    }
    return node
  }

  /**
    Set a property to a new value.

    @param {String[]} property path
    @param {any} newValue
    @returns {DocumentNode} The deleted node.

    @example

    ```js
    doc.transaction(function(tx) {
      tx.set(['p1', 'content'], "Hello there! I'm a new paragraph.")
    })
    ```
  */
  set (path, value) {
    const oldValue = this.get(path)
    const op = this._set(path, value)
    if (op) {
      this._ops.push(op)
      if (!this._isTransactionDocument) {
        this._emitChange(op)
      }
    }
    return oldValue
  }

  /**
    Update a property incrementally.

    @param {Array} property path
    @param {Object} diff
    @returns {any} The value before applying the update.

    @example

    Inserting text into a string property:
    ```
    doc.update(['p1', 'content'], { insert: {offset: 3, value: "fee"} })
    ```
    would turn "Foobar" into "Foofeebar".

    Deleting text from a string property:
    ```
    doc.update(['p1', 'content'], { delete: {start: 0, end: 3} })
    ```
    would turn "Foobar" into "bar".

    Inserting into an array:
    ```
    doc.update(['p1', 'content'], { insert: {offset: 2, value: 0} })
    ```
    would turn `[1,2,3,4]` into `[1,2,0,3,4]`.

    Deleting from an array:
    ```
    doc.update(['body', 'nodes'], { delete: { offset: 2 } })
    ```
    would turn `[1,2,3,4]` into `[1,2,4]`.
  */
  update (path, diff) {
    const op = this._update(path, diff)
    if (op) {
      this._ops.push(op)
      if (!this._isTransactionDocument) {
        this._emitChange(op)
      }
    }
    return op
  }

  /*
    Update multiple properties of a node by delegating to Document.set for each
    changed property.
  */
  updateNode (id, newProps) {
    let node = this.get(id)
    forEach(newProps, (value, key) => {
      if (!isEqual(node[key], newProps[key])) {
        this.set([id, key], value)
      }
    })
  }

  /**
    Add a document index.

    @param {String} name
    @param {DocumentIndex} index
  */
  addIndex (name, index) {
    return this.data.addIndex(name, index)
  }

  /**
    @param {String} name
    @returns {DocumentIndex} the node index with given name.
  */
  getIndex (name) {
    return this.data.getIndex(name)
  }

  /**
    Creates a selection which is attached to this document.
    Every selection implementation provides its own
    parameter format which is basically a JSON representation.

    @param {model/Selection} sel An object describing the selection.

    @example

    Creating a PropertySelection:

    ```js
    doc.createSelection({
      type: 'property',
      path: [ 'text1', 'content'],
      startOffset: 10,
      endOffset: 20,
      containerPath: 'body'
    })
    ```

    Creating a ContainerSelection:

    ```js
    doc.createSelection({
      type: 'container',
      containerPath: 'body',
      startPath: [ 'p1', 'content'],
      startOffset: 10,
      endPath: [ 'p2', 'content'],
      endOffset: 20
    })
    ```

    Creating a NullSelection:

    ```js
    doc.createSelection(null)
    ```
  */
  createSelection (data) {
    let sel
    if (isNil(data)) return Selection.nullSelection
    if (arguments.length !== 1 || !isPlainObject(data)) {
      throw new Error('Illegal argument: call createSelection({ type: ... }')
    } else {
      switch (data.type) {
        case 'property': {
          if (isNil(data.endOffset)) {
            data.endOffset = data.startOffset
          }
          if (!data.hasOwnProperty('reverse')) {
            if (data.startOffset > data.endOffset) {
              [data.startOffset, data.endOffset] = [data.endOffset, data.startOffset]
              data.reverse = !data.reverse
            }
          }
          // integrity checks:
          let text = this.get(data.path, 'strict')
          if (data.startOffset < 0 || data.startOffset > text.length) {
            throw new Error('Invalid startOffset: target property has length ' + text.length + ', given startOffset is ' + data.startOffset)
          }
          if (data.endOffset < 0 || data.endOffset > text.length) {
            throw new Error('Invalid startOffset: target property has length ' + text.length + ', given endOffset is ' + data.endOffset)
          }
          sel = new PropertySelection(data)
          break
        }
        case 'container': {
          let containerPath = data.containerPath
          let ids = this.get(containerPath)
          if (!ids) throw new Error('Can not create ContainerSelection: container "' + containerPath + '" does not exist.')
          let start = this._normalizeCoor({ path: data.startPath, offset: data.startOffset, containerPath })
          let end = this._normalizeCoor({ path: data.endPath, offset: data.endOffset, containerPath })
          if (!data.hasOwnProperty('reverse')) {
            if (compareCoordinates(this, containerPath, start, end) > 0) {
              [start, end] = [end, start]
              data.reverse = true
            }
          }
          sel = new ContainerSelection(containerPath, start.path, start.offset, end.path, end.offset, data.reverse, data.surfaceId)
          break
        }
        case 'node': {
          sel = createNodeSelection({
            doc: this,
            nodeId: data.nodeId,
            mode: data.mode,
            containerPath: data.containerPath,
            reverse: data.reverse,
            surfaceId: data.surfaceId
          })
          break
        }
        case 'custom': {
          sel = CustomSelection.fromJSON(data)
          break
        }
        default:
          throw new Error('Illegal selection type', data)
      }
    }
    if (!sel.isNull()) {
      sel.attach(this)
    }
    return sel
  }

  newInstance () {
    var DocumentClass = this.constructor
    return new DocumentClass(this.schema)
  }

  // useful in combination with paste transformation
  createSnippet () {
    var snippet = this.newInstance()
    var snippetContainer = snippet.create({
      type: '@container',
      id: SNIPPET_ID
    })
    snippet.getContainer = function () {
      return snippetContainer
    }
    return snippet
  }

  rebase (change, onto) {
    onto = onto.map(c => c.clone())
    transformDocumentChange(onto, change)
    return change
  }

  createFromDocument (doc) {
    // clear all content, otherwise there would be an inconsistent mixture
    this.clear()

    // Note: trying to bring the nodes into a correct order
    // so that they can be created safely without causing troubles
    // For example, a list-item should be created before its parent list.
    // But a paragraph should be created before their annotations
    // TODO: we should rethink the exception with annotations here
    // in XML the annotation would be a child of the paragraph
    // and thus should be created before hand. However our annotation indexes need the annotation target to exist.
    let nodes = Object.values(doc.getNodes())
    let levels = {}
    let visited = new Set()
    nodes.forEach(n => {
      if (!visited.has(n)) this._computeDependencyLevel(n, levels, visited)
    })
    // descending order: i.e. nodes with a deeper level get created first
    nodes.sort((a, b) => {
      return levels[b.id] - levels[a.id]
    })
    nodes.forEach(n => this.create(n))
    return this
  }

  _computeDependencyLevel (node, levels, visited) {
    if (!node) throw new Error('node was nil')
    if (visited.has(node)) throw new Error('Cyclic node dependency')
    visited.add(node)
    // HACK: as of the comment above, annotations are currently treated as overlay
    // not as children. So we assign level -1 to all annotations, meaning
    // that they are 'on-top-of' the content, and being created at the very last
    let level = 0
    if (node.isAnnotation() || node.isInlineNode()) {
      level = -1
    } else {
      let parent = node.getParent()
      if (parent) {
        let parentLevel
        if (levels.hasOwnProperty(parent.id)) {
          parentLevel = levels[parent.id]
        } else {
          parentLevel = this._computeDependencyLevel(parent, levels, visited)
        }
        level = parentLevel + 1
      }
    }
    levels[node.id] = level
    return level
  }

  /**
    Convert to JSON.

    @returns {Object} Plain content.
  */
  toJSON () {
    return converter.exportDocument(this)
  }

  clone () {
    let copy = this.newInstance()
    copy.createFromDocument(this)
    return copy
  }

  clear () {
    this.data.clear()
    this._ops.length = 0
  }

  /*
    Provides a high-level turtle-graphics style interface
    to this document
  */
  createEditingInterface () {
    return new EditingInterface(this)
  }

  invert (change) {
    return change.invert()
  }

  _apply (documentChange) {
    forEach(documentChange.ops, (op) => {
      this._applyOp(op)
    })
    // extract aggregated information, such as which property has been affected etc.
    documentChange._extractInformation(this)
  }

  _applyOp (op) {
    this.data.apply(op)
    this.emit('operation:applied', op)
  }

  _create (nodeData) {
    return this.data.create(nodeData)
  }

  _delete (nodeId) {
    return this.data.delete(nodeId)
  }

  _set (path, value) {
    return this.data.set(path, value)
  }

  _update (path, diff) {
    return this.data.update(path, diff)
  }

  _emitChange (op) {
    const change = new DocumentChange([op], {}, {})
    change._extractInformation(this)
    this._notifyChangeListeners(change, { hidden: true })
  }

  _notifyChangeListeners (change, info) {
    info = info || {}
    this.emit('document:changed', change, info, this)
  }

  // NOTE: this is still here because DOMSelection is using it
  _createSelectionFromRange (range) {
    if (!range) return Selection.nullSelection
    let inOneNode = isEqual(range.start.path, range.end.path)
    if (inOneNode) {
      if (range.start.isNodeCoordinate()) {
        // ATTENTION: we only create full NodeSelections
        // when mapping from the DOM to Model  return new NodeSelection(range.containerPath, range.start.getNodeId(), mode, range.reverse, range.surfaceId)
        return new NodeSelection(range.containerPath, range.start.getNodeId(), 'full', range.reverse, range.surfaceId)
      } else {
        return this.createSelection({
          type: 'property',
          path: range.start.path,
          startOffset: range.start.offset,
          endOffset: range.end.offset,
          reverse: range.reverse,
          containerPath: range.containerPath,
          surfaceId: range.surfaceId
        })
      }
    } else {
      return this.createSelection({
        type: 'container',
        startPath: range.start.path,
        startOffset: range.start.offset,
        endPath: range.end.path,
        endOffset: range.end.offset,
        reverse: range.reverse,
        containerPath: range.containerPath,
        surfaceId: range.surfaceId
      })
    }
  }

  _normalizeCoor ({ path, offset, containerPath }) {
    // NOTE: normalizing so that a node coordinate is used only for 'isolated nodes'
    if (path.length === 1) {
      // FIXME: originally getContainerRoot was called here
      // however in this case
      let node = getContainerRoot(this, containerPath, path[0])
      if (node.isText()) {
        // console.warn("DEPRECATED: don't use node coordinates for TextNodes. Use selectionHelpers instead to set cursor at first or last position conveniently.")
        return new Coordinate(node.getPath(), offset === 0 ? 0 : node.getLength())
      } else if (node.isList()) {
        // console.warn("DEPRECATED: don't use node coordinates for ListNodes. Use selectionHelpers instead to set cursor at first or last position conveniently.")
        if (offset === 0) {
          let item = node.getItemAt(0)
          return new Coordinate(item.getPath(), 0)
        } else {
          let item = this.get(last(node.items))
          return new Coordinate(item.getPath(), item.getLength())
        }
      }
    }
    return new Coordinate(path, offset)
  }

  get _isDocument () { return true }
}
