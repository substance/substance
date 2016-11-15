import isEqual from 'lodash/isEqual'
import isObject from 'lodash/isObject'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import forEach from '../util/forEach'
import uuid from '../util/uuid'
import EventEmitter from '../util/EventEmitter'
import DocumentIndex from './DocumentIndex'
import AnnotationIndex from './AnnotationIndex'
import ContainerAnnotationIndex from './ContainerAnnotationIndex'
import AnchorIndex from './AnchorIndex'
import MarkerIndex from './MarkerIndex'
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
import docHelpers from './documentHelpers'
import JSONConverter from './JSONConverter'

var converter = new JSONConverter()

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
    this.addIndex('type', DocumentIndex.create({ property: "type" }))

    // special index for (property-scoped) annotations
    this.addIndex('annotations', new AnnotationIndex())

    // TODO: these are only necessary if there is a container annotation
    // in the schema
    // special index for (container-scoped) annotations
    this.addIndex('container-annotations', new ContainerAnnotationIndex())
    this.addIndex('container-annotation-anchors', new AnchorIndex())

    // index for markers
    this.addIndex('markers', new MarkerIndex())

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

    // Note: using the general event queue (as opposed to calling _updateEventProxies from within _notifyChangeListeners)
    // so that handler priorities are considered correctly
    this.on('document:changed', this._updateEventProxies, this)
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
    Provides the so called real for a property.

    With our flat model, properties usually have 2-component path,
    e.g. 'text1.content'
    With ids, which are comparable to symlinks on the file-system
    it sometimes makes sense to describe a property in its parent context.
    For example a list item could be addressed via its parent: `['list1', 'items', 1, 'content']`
    Here `this.getRealPath()` would provide something like `['list-item-xyz', 'content']`
    The real path makes Operational Transforms more robust, as such changes are independent
    of its parent.
  */
  getRealPath(path) {
    return this.data.getRealPath(path)
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
    this._notifyChangeListeners(change)
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
    this._notifyChangeListeners(change)
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
    this._notifyChangeListeners(change)
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
    this._notifyChangeListeners(change)
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
    doc.createSelection([ 'text1', 'content'], 10, 20)
    ```

    Creating a ContainerSelection:

    ```js
    doc.createSelection('main', [ 'p1', 'content'], 10, [ 'p2', 'content'], 20)
    ```

    Creating a NullSelection:

    ```js
    doc.createSelection(null)
    ```

    You can also call this method with JSON data

    ```js
    doc.createSelection({
      type: 'property',
      path: [ 'p1', 'content'],
      startOffset: 10,
      endOffset: 20
    })
    ```
  */
  createSelection() {
    var sel = _createSelection.apply(this, arguments)
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
    console.warn('DEPRECATED: use docHelpers.getTextForSelection() instead.')
    return docHelpers.getTextForSelection(this, sel)
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

}

Document.prototype._isDocument = true

// used by transforms copy, paste
// and by ClipboardImporter/Exporter
Document.SNIPPET_ID = "snippet"
Document.TEXT_SNIPPET_ID = "text-snippet"


export default Document


function _createSelection() {
  var doc = this; // eslint-disable-line
  var coor, range, path, startOffset, endOffset
  if (arguments.length === 1 && arguments[0] === null) {
    return Selection.nullSelection
  }
  if (arguments[0] instanceof Coordinate) {
    coor = arguments[0]
    if (coor.isNodeCoordinate()) {
      return NodeSelection._createFromCoordinate(coor)
    } else {
      return new PropertySelection(coor.path, coor.offset, coor.offset)
    }
  }
  else if (arguments[0] instanceof Range) {
    range = arguments[0]
    var inOneNode = isEqual(range.start.path, range.end.path)
    if (inOneNode) {
      if (range.start.isNodeCoordinate()) {
        return NodeSelection._createFromRange(range)
      } else {
        return new PropertySelection(range.start.path, range.start.offset, range.end.offset, range.reverse, range.containerId)
      }
    } else {
      return new ContainerSelection(range.containerId, range.start.path, range.start.offset, range.end.path, range.end.offset, range.reverse)
    }
  }
  else if (arguments.length === 1 && isObject(arguments[0])) {
    return _createSelectionFromData(doc, arguments[0])
  }
  // createSelection(startPath, startOffset)
  else if (arguments.length === 2 && isArray(arguments[0])) {
    path = arguments[0]
    startOffset = arguments[1]
    return new PropertySelection(path, startOffset, startOffset)
  }
  // createSelection(startPath, startOffset, endOffset)
  else if (arguments.length === 3 && isArray(arguments[0])) {
    path = arguments[0]
    startOffset = arguments[1]
    endOffset = arguments[2]
    return new PropertySelection(path, startOffset, endOffset, startOffset>endOffset)
  }
  // createSelection(containerId, startPath, startOffset, endPath, endOffset)
  else if (arguments.length === 5 && isString(arguments[0])) {
    return _createSelectionFromData(doc, {
      type: 'container',
      containerId: arguments[0],
      startPath: arguments[1],
      startOffset: arguments[2],
      endPath: arguments[3],
      endOffset: arguments[4]
    })
  } else {
    console.error('Illegal arguments for Selection.create().', arguments)
    return Selection.nullSelection
  }
}

function _createSelectionFromData(doc, selData) {
  var tmp
  if (selData.type === 'property') {
    if (selData.endOffset === null || selData.endOffset === undefined) {
      selData.endOffset = selData.startOffset
    }
    if (!selData.hasOwnProperty('reverse')) {
      if (selData.startOffset>selData.endOffset) {
        tmp = selData.startOffset
        selData.startOffset = selData.endOffset
        selData.endOffset = tmp
        selData.reverse = true
      } else {
        selData.reverse = false
      }
    }
    return new PropertySelection(selData.path, selData.startOffset, selData.endOffset, selData.reverse, selData.containerId, selData.surfaceId)
  } else if (selData.type === 'container') {
    var container = doc.get(selData.containerId, 'strict')
    var start = new Coordinate(selData.startPath, selData.startOffset)
    var end = new Coordinate(selData.endPath, selData.endOffset)
    var startAddress = container.getAddress(start)
    var endAddress = container.getAddress(end)
    var isReverse = selData.reverse
    if (!startAddress) {
      throw new Error('Invalid arguments for ContainerSelection: ', start.toString())
    }
    if (!endAddress) {
      throw new Error('Invalid arguments for ContainerSelection: ', end.toString())
    }
    if (!selData.hasOwnProperty('reverse')) {
      isReverse = endAddress.isBefore(startAddress, 'strict')
      if (isReverse) {
        tmp = start
        start = end
        end = tmp
      }
    }

    // ATTENTION: since Beta4 we are not supporting partial
    // selections of nodes other than text nodes
    // Thus we are turning other property coordinates into node coordinates
    _allignCoordinate(doc, start, true)
    _allignCoordinate(doc, end, false)

    return new ContainerSelection(container.id, start.path, start.offset, end.path, end.offset, isReverse, selData.surfaceId)
  }
  else if (selData.type === 'node') {
    return NodeSelection.fromJSON(selData)
  } else if (selData.type === 'custom') {
    return CustomSelection.fromJSON(selData)
  } else {
    throw new Error('Illegal selection type', selData)
  }
}

function _allignCoordinate(doc, coor, isStart) {
  if (!coor.isNodeCoordinate()) {
    var nodeId = coor.getNodeId()
    var node = doc.get(nodeId)
    if (!node.isText()) {
      console.warn('Selecting a non-textish node partially is not supported. Select the full node.')
      coor.path = [nodeId]
      coor.offset = isStart ? 0 : 1
    }
  }
}
