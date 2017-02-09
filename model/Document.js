import isArray from '../util/isArray'
import isEqual from '../util/isEqual'
import isNil from '../util/isNil'
import isPlainObject from '../util/isPlainObject'
import isString from '../util/isString'
import forEach from '../util/forEach'
import last from '../util/last'
import uuid from '../util/uuid'
import EventEmitter from '../util/EventEmitter'
import PropertyIndex from './data/PropertyIndex'
import AnnotationIndex from './AnnotationIndex'
import ContainerAnnotationIndex from './ContainerAnnotationIndex'
// import AnchorIndex from './AnchorIndex'
import DocumentChange from './DocumentChange'
import PathEventProxy from './PathEventProxy'
import IncrementalData from './data/IncrementalData'
import DocumentNodeFactory from './DocumentNodeFactory'
import Selection from './Selection'
import PropertySelection from './PropertySelection'
import ContainerSelection from './ContainerSelection'
import NodeSelection from './NodeSelection'
import CustomSelection from './CustomSelection'
import Coordinate from './Coordinate'
import Range from './Range'
import documentHelpers from './documentHelpers'
import { createNodeSelection } from './selectionHelpers'
import JSONConverter from './JSONConverter'
import ParentNodeHook from './ParentNodeHook'

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

class Document extends EventEmitter {

  /**
    @param {DocumentSchema} schema The document schema.
  */
  constructor(schema) {
    super()

    // HACK: to be able to inherit but not execute this ctor
    if (arguments[0] === 'SKIP') return

    this.__id__ = uuid()

    if (!schema) {
      throw new Error('A document needs a schema for reflection.')
    }

    this.schema = schema
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(schema, {
      nodeFactory: this.nodeFactory
    })

    // all by type
    this.addIndex('type', new PropertyIndex('type'))

    // special index for (property-scoped) annotations
    this.addIndex('annotations', new AnnotationIndex())

    // TODO: these are only necessary if there is a container annotation
    // in the schema
    // special index for (container-scoped) annotations
    this.addIndex('container-annotations', new ContainerAnnotationIndex())
    // this.addIndex('container-annotation-anchors', new AnchorIndex())

    // change event proxies are triggered after a document change has been applied
    // before the regular document:changed event is fired.
    // They serve the purpose of making the event notification more efficient
    // In earlier days all observers such as node views where listening on the same event 'operation:applied'.
    // This did not scale with increasing number of nodes, as on every operation all listeners where notified.
    // The proxies filter the document change by interest and then only notify a small set of observers.
    // Example: NotifyByPath notifies only observers which are interested in changes to a certain path.
    this.eventProxies = {
      'path': new PathEventProxy(this),
    }
    this.on('document:changed', this._updateEventProxies, this)
    // TODO: maybe we want to have a generalized concept for such low-level hooks
    // e.g. indexes are similar
    ParentNodeHook.register(this)
  }

  get id() {
    return this.__id__
  }

  /**
    @returns {model/DocumentSchema} the document's schema.
  */
  getSchema() {
    return this.schema
  }

  /**
    Check if this storage contains a node with given id.

    @returns {Boolean} `true` if a node with id exists, `false` otherwise.
  */
  contains(id) {
    return this.data.contains(id)
  }

  /**
    Get a node or value via path.

    @param {String|String[]} path node id or path to property.
    @returns {DocumentNode|any|undefined} a Node instance, a value or undefined if not found.
  */
  get(path, strict) {
    return this.data.get(path, strict)
  }

  /**
    @return {Object} A hash of {@link model/DocumentNode} instances.
  */
  getNodes() {
    return this.data.getNodes()
  }

  /**
    Creates a context like a transaction for importing nodes.
    This is important in presence of cyclic dependencies.
    Indexes will not be updated during the import but will afterwards
    when all nodes are have been created.

    @private
    @param {Function} importer a `function(doc)`, where with `doc` is a `model/AbstractDocument`

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
  import(importer) {
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
    doc.transaction(function(tx) {
      tx.create({
        id: 'p1',
        type: 'paragraph',
        content: 'Hi I am a Substance paragraph.'
      })
    })
    ```
  */
  create(nodeData) {
    if (!nodeData.id) {
      nodeData.id = uuid(nodeData.type)
    }
    var op = this._create(nodeData)
    var change = new DocumentChange([op], {}, {})
    change._extractInformation(this)
    this._notifyChangeListeners(change, { hidden: true })
    return this.data.get(nodeData.id)
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
  delete(nodeId) {
    var node = this.get(nodeId)
    var op = this._delete(nodeId)
    var change = new DocumentChange([op], {}, {})
    change._extractInformation(this)
    this._notifyChangeListeners(change, { hidden: true })
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
  set(path, value) {
    var oldValue = this.get(path)
    var op = this._set(path, value)
    var change = new DocumentChange([op], {}, {})
    change._extractInformation(this)
    this._notifyChangeListeners(change, { hidden: true })
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
    doc.update(['body', 'nodes'], { delete: 2 })
    ```
    would turn `[1,2,3,4]` into `[1,2,4]`.
  */
  update(path, diff) {
    var op = this._update(path, diff)
    var change = new DocumentChange([op], {}, {})
    change._extractInformation(this)
    this._notifyChangeListeners(change, { hidden: true })
    return op
  }

  /**
    Add a document index.

    @param {String} name
    @param {DocumentIndex} index
  */
  addIndex(name, index) {
    return this.data.addIndex(name, index)
  }

  /**
    @param {String} name
    @returns {DocumentIndex} the node index with given name.
  */
  getIndex(name) {
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
      containerId: 'body'
    })
    ```

    Creating a ContainerSelection:

    ```js
    doc.createSelection({
      type: 'container',
      containerId: 'body',
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
  createSelection(data) {
    let sel
    if (isNil(data)) return Selection.nullSelection
    if (arguments.length !== 1 || !isPlainObject(data)) {
      sel = _createSelectionLegacy(this, arguments)
    } else {
      switch (data.type) {
        case 'property': {
          if (isNil(data.endOffset)) {
            data.endOffset = data.startOffset
          }
          if (!data.hasOwnProperty('reverse')) {
            if (data.startOffset>data.endOffset) {
              [data.startOffset, data.endOffset] = [data.endOffset, data.startOffset]
              data.reverse = !data.reverse
            }
          }
          // integrity checks:
          let text = this.get(data.path, 'strict')
          if (data.startOffset < 0 || data.startOffset > text.length) {
            throw new Error('Invalid startOffset: target property has length '+text.length+', given startOffset is ' + data.startOffset)
          }
          if (data.endOffset < 0 || data.endOffset > text.length) {
            throw new Error('Invalid startOffset: target property has length '+text.length+', given endOffset is ' + data.endOffset)
          }
          sel = new PropertySelection(data)
          break
        }
        case 'container': {
          let container = this.get(data.containerId, 'strict')
          if (!container) throw new Error('Can not create ContainerSelection: container "'+data.containerId+'" does not exist.')
          let start = this._normalizeCoor({ path: data.startPath, offset: data.startOffset})
          let end = this._normalizeCoor({ path: data.endPath, offset: data.endOffset})
          let startAddress = container.getAddress(start)
          let endAddress = container.getAddress(end)
          if (!startAddress) {
            throw new Error('Invalid arguments for ContainerSelection: ', start.toString())
          }
          if (!endAddress) {
            throw new Error('Invalid arguments for ContainerSelection: ', end.toString())
          }
          if (!data.hasOwnProperty('reverse')) {
            if (endAddress.isBefore(startAddress, 'strict')) {
              [start, end] = [end, start]
              data.reverse = true
            }
          }
          sel = new ContainerSelection(container.id, start.path, start.offset, end.path, end.offset, data.reverse, data.surfaceId)
          break
        }
        case 'node': {
          sel = createNodeSelection({
            doc: this,
            nodeId: data.nodeId,
            mode: data.mode,
            containerId: data.containerId,
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

  getEventProxy(name) {
    return this.eventProxies[name]
  }

  newInstance() {
    var DocumentClass = this.constructor
    return new DocumentClass(this.schema)
  }

  // useful in combination with paste transformation
  createSnippet() {
    var snippet = this.newInstance()
    var snippetContainer = snippet.create({
      type: 'container',
      id: Document.SNIPPET_ID
    })
    snippet.getContainer = function() {
      return snippetContainer
    }
    snippet.show = function() {
      snippetContainer.show.apply(snippetContainer, arguments)
    }
    return snippet
  }

  fromSnapshot(data) {
    var doc = this.newInstance()
    doc.loadSeed(data)
    return doc
  }

  getDocumentMeta() {
    return this.get('document')
  }

  _apply(documentChange) {
    forEach(documentChange.ops, function(op) {
      this.data.apply(op)
      this.emit('operation:applied', op)
    }.bind(this))
    // extract aggregated information, such as which property has been affected etc.
    documentChange._extractInformation(this)
  }

  _notifyChangeListeners(change, info) {
    info = info || {}
    this.emit('document:changed', change, info, this)
  }

  _updateEventProxies(change, info) {
    forEach(this.eventProxies, function(proxy) {
      proxy.onDocumentChanged(change, info, this)
    }.bind(this))
  }

  /**
   * DEPRECATED: We will drop support as this should be done in a more
   *             controlled fashion using an importer.
   * @skip
   */
  loadSeed(seed) {
    // clear all existing nodes (as they should be there in the seed)
    forEach(this.data.nodes, function(node) {
      this.delete(node.id)
    }.bind(this))
    // create nodes
    forEach(seed.nodes, function(nodeData) {
      this.create(nodeData)
    }.bind(this))
  }

  /**
    Convert to JSON.

    @returns {Object} Plain content.
  */
  toJSON() {
    return converter.exportDocument(this)
  }

  getTextForSelection(sel) {
    console.warn('DEPRECATED: use documentHelpers.getTextForSelection() instead.')
    return documentHelpers.getTextForSelection(this, sel)
  }

  setText(path, text, annotations) {
    // TODO: this should go into document helpers.
    var idx
    var oldAnnos = this.getIndex('annotations').get(path)
    // TODO: what to do with container annotations
    for (idx = 0; idx < oldAnnos.length; idx++) {
      this.delete(oldAnnos[idx].id)
    }
    this.set(path, text)
    for (idx = 0; idx < annotations.length; idx++) {
      this.create(annotations[idx])
    }
  }

  getAnnotations(path) {
    return this.getIndex('annotations').get(path)
  }

  _create(nodeData) {
    var op = this.data.create(nodeData)
    return op
  }

  _delete(nodeId) {
    var op = this.data.delete(nodeId)
    return op
  }

  _update(path, diff) {
    var op = this.data.update(path, diff)
    return op
  }

  _set(path, value) {
    var op = this.data.set(path, value)
    return op
  }

  // NOTE: this is still here because DOMSelection is using it
  _createSelectionFromRange(range) {
    if (!range) return Selection.nullSelection
    let inOneNode = isEqual(range.start.path, range.end.path)
    if (inOneNode) {
      if (range.start.isNodeCoordinate()) {
        // ATTENTION: we only create full NodeSelections
        // when mapping from the DOM to Model  return new NodeSelection(range.containerId, range.start.getNodeId(), mode, range.reverse, range.surfaceId)
        return new NodeSelection(range.containerId, range.start.getNodeId(), 'full', range.reverse, range.surfaceId)
      } else {
        return this.createSelection({
          type: 'property',
          path: range.start.path,
          startOffset: range.start.offset,
          endOffset: range.end.offset,
          reverse: range.reverse,
          containerId: range.containerId,
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
        containerId: range.containerId,
        surfaceId: range.surfaceId
      })
    }
  }

  _normalizeCoor({ path, offset }) {
    // NOTE: normalizing so that a node coordinate is used only for 'isolated nodes'
    if (path.length === 1) {
      let node = this.get(path[0]).getRoot()
      if (node.isText()) {
        // console.warn("DEPRECATED: don't use node coordinates for TextNodes. Use selectionHelpers instead to set cursor at first or last position conveniently.")
        return new Coordinate(node.getTextPath(), offset === 0 ? 0 : node.getLength())
      } else if (node.isList()) {
        // console.warn("DEPRECATED: don't use node coordinates for ListNodes. Use selectionHelpers instead to set cursor at first or last position conveniently.")
        if (offset === 0) {
          let item = node.getItemAt(0)
          return new Coordinate(item.getTextPath(), 0)
        } else {
          let item = this.get(last(node.items))
          return new Coordinate(item.getTextPath(), item.getLength())
        }
      }
    }
    return new Coordinate(path, offset)
  }

}

Document.prototype._isDocument = true

// used by transforms copy, paste
// and by ClipboardImporter/Exporter
Document.SNIPPET_ID = "snippet"

Document.TEXT_SNIPPET_ID = "text-snippet"


/* Internals */

// DEPRECATED legacy support
function _createSelectionLegacy(doc, args) {
  console.warn('DEPRECATED: use document.createSelection({ type: ... }) instead')
  // createSelection(coor)
  if (args[0] instanceof Coordinate) {
    let coor = args[0]
    if (coor.isNodeCoordinate()) {
      return NodeSelection._createFromCoordinate(coor)
    } else {
      return doc.createSelection({
        type: 'property',
        path: coor.path,
        startOffset: coor.offset,
      })
    }
  }
  // createSelection(range)
  else if (args[0] instanceof Range) {
    return doc._createSelectionFromRange(args[0])
  }
  // createSelection(startPath, startOffset)
  else if (args.length === 2 && isArray(args[0])) {
    return doc.createSelection({
      type: 'property',
      path: args[0],
      startOffset: args[1]
    })
  }
  // createSelection(startPath, startOffset, endOffset)
  else if (args.length === 3 && isArray(args[0])) {
    return doc.createSelection({
      type: 'property',
      path: args[0],
      startOffset: args[1],
      endOffset: args[2]
    })
  }
  // createSelection(containerId, startPath, startOffset, endPath, endOffset)
  else if (args.length === 5 && isString(args[0])) {
    return doc.createSelection({
      type: 'container',
      containerId: args[0],
      startPath: args[1],
      startOffset: args[2],
      endPath: args[3],
      endOffset: args[4]
    })
  } else {
    console.error('Illegal arguments for document.createSelection().', args)
    return doc.createSelection(null)
  }
}

export default Document
