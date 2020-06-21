import isEqual from '../util/isEqual'
import forEach from '../util/forEach'
import uuid from '../util/uuid'
import EventEmitter from '../util/EventEmitter'
import AnnotationIndex from './AnnotationIndex'
import ContainerAnnotationIndex from './ContainerAnnotationIndex'
import TypeIndex from './TypeIndex'
import RelationshipIndex from './RelationshipIndex'
import DocumentChange from './DocumentChange'
import IncrementalData from './IncrementalData'
import DocumentNodeFactory from './DocumentNodeFactory'
import EditingInterface from './EditingInterface'
import Selection from './Selection'
import NodeSelection from './NodeSelection'
import { createSelection } from './selectionHelpers'
import JSONConverter from './JSONConverter'
import ParentNodeHook from './ParentNodeHook'
import { SNIPPET_ID } from './documentHelpers'
import { transformDocumentChange } from './operationHelpers'
import hasOwnProperty from '../util/hasOwnProperty'

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

    // used internally
    this._ops = []

    this._initialize(...args)
  }

  _initialize () {
    this.__id__ = uuid()
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(this.schema, this.nodeFactory)
    // all by type
    this.addIndex('type', new TypeIndex('type'))
    // index for (property-scoped) annotations
    this.addIndex('annotations', new AnnotationIndex())
    // index for (container-scoped) annotations
    // TODO: enable this only if there is a container annotation in the schema
    this.addIndex('container-annotations', new ContainerAnnotationIndex())
    // a reverse-index for relationship type properties ('one' or 'many')
    // TODO: enable this only if there is a node with relationship property in the schema
    this.addIndex('relationships', new RelationshipIndex())
    // TODO: maybe we want to have a generalized concept for such low-level hooks
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
    const prop = this.getProperty(path)
    if (!prop) {
      if (strict) {
        throw new Error('Invalid path')
      } else {
        return undefined
      }
    }
    const val = this.get(path, strict)
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
    const [nodeId, propName] = path
    const node = this.get(nodeId)
    if (node) {
      return node.getSchema().getProperty(propName)
    } else {
      throw new Error('Invalid path.')
    }
  }

  fromJson (json) {
    try {
      // Node: json data may come in inappropriate order
      // where indexes could be choking
      this.data._stopIndexing()
      if (!json.nodes) {
        throw new Error('Invalid JSON format.')
      }
      // the json should just be an array of nodes
      const nodeEntries = json.nodes
      nodeEntries.forEach(nodeData => {
        if (this.data.contains(nodeData.id)) {
          this.delete(nodeData.id)
        }
        this.create(nodeData)
      })
      this.data._startIndexing()
    } finally {
      this.data.queue = []
      this.data._startIndexing()
    }
    return this
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
      this._emitInternalChange(op)
      return this.get(nodeData.id)
    }
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
      this._emitInternalChange(op)
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
      this._emitInternalChange(op)
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
      this._emitInternalChange(op)
    }
    return op
  }

  /*
    Update multiple properties of a node by delegating to Document.set for each
    changed property.
  */
  updateNode (id, newProps) {
    const node = this.get(id)
    forEach(newProps, (value, key) => {
      if (!isEqual(node.get(key), value)) {
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

  createSelection (data) {
    return createSelection(this, data)
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
    if (onto.length > 0) {
      // ATTENTION: rebase uses mostly the same implementation as transform with some exceptions
      // FIXME: IMO this is mostly because of wrong design
      // ATTENTION 2: treating 'onto' as immutable, only updating 'change'
      transformDocumentChange(onto, change, { rebase: true, immutableLeft: true })
    }
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
    const nodes = Array.from(doc.getNodes().values())
    const levels = {}
    const visited = new Set()
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
      const parent = node.getParent()
      if (parent) {
        let parentLevel
        if (hasOwnProperty(levels, parent.id)) {
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
    const copy = this.newInstance()
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
    const ops = documentChange.ops
    for (const op of ops) {
      this._applyOp(op)
    }
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

  _createDocumentChange (ops, before, after, info) {
    return new DocumentChange(ops, before, after, info)
  }

  _emitInternalChange (op) {
    const change = this._createDocumentChange([op], {}, {})
    change._extractInformation(this)
    this.emit('document:changed:internal', change, this)
  }

  _notifyChangeListeners (change, info = {}) {
    this.emit('document:changed', change, info, this)
  }

  // NOTE: this is still here because DOMSelection is using it
  _createSelectionFromRange (range) {
    if (!range) return Selection.nullSelection
    const inOneNode = isEqual(range.start.path, range.end.path)
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

  get _isDocument () { return true }
}
