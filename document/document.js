'use strict';

var _ = require('../basics/helpers');
var Substance = require('../basics');
var Data = require('../data');
var AbstractDocument = require('./abstract_document');

var AnnotationIndex = require('./annotation_index');
var AnchorIndex = require('./anchor_index');
var ContainerAnnotationIndex = require('./container_annotation_index');

var TransactionDocument = require('./transaction_document');
var DocumentChange = require('./document_change');

var PathEventProxy = require('./path_event_proxy');
var ClipboardImporter = require('./clipboard_importer');
var ClipboardExporter = require('./clipboard_exporter');

var __id__ = 0;

function Document(schema) {
  AbstractDocument.call(this, schema);
  this.__id__ = __id__++;

  // all by type
  this.nodeIndex = this.addIndex('type', Data.Index.create({
    property: "type"
  }));

  // special index for (property-scoped) annotations
  this.annotationIndex = this.addIndex('annotations', new AnnotationIndex());

  // special index for (contaoiner-scoped) annotations
  this.anchorIndex = this.addIndex('container-annotation-anchors', new AnchorIndex());

  // HACK: ATM we can't register this as Data.Index, as it depends on Containers to be up2date,
  // but containers are updated after indexes.
  // This must not be used from within transactions.
  this.containerAnnotationIndex = new ContainerAnnotationIndex(this);

  this.done = [];
  this.undone = [];

  // change event proxies are triggered after a document change has been applied
  // before the regular document:changed event is fired.
  // They serve the purpose of making the event notification more efficient
  // In earlier days all observers such as node views where listening on the same event 'operation:applied'.
  // This did not scale with increasing number of nodes, as on every operation all listeners where notified.
  // The proxies filter the document change by interest and then only notify a small set of observers.
  // Example: NotifyByPath notifies only observers which are interested in changes to a certain path.
  this.eventProxies = {
    'path': new PathEventProxy(this),
  };

  this.initialize();

  // the stage is a essentially a clone of this document
  // used to apply a sequence of document operations
  // without touching this document
  this.stage = new TransactionDocument(this);
  this.isTransacting = false;

  this.FORCE_TRANSACTIONS = false;

  // Note: using the general event queue (as opposed to calling updateEventProxies from within _notifyChangeListeners)
  // so that handler priorities are considered correctly
  this.connect(this, {
    'document:changed': this.updateEventProxies
  })
}

Document.Prototype = function() {

  this.isTransaction = function() {
    return false;
  };

  this.newInstance = function() {
    var DocumentClass = this.constructor;
    return new DocumentClass(this.schema);
  };

  this.fromSnapshot = function(data) {
    var doc = this.newInstance();
    doc.loadSeed(data);
    return doc;
  };

  this.documentDidLoad = function() {
    // HACK: need to reset the stage
    this.stage.reset();
    this.containerAnnotationIndex.reset();
    this.done = [];
    // do not allow non-transactional changes after that
    this.FORCE_TRANSACTIONS = true;
  };

  this.clear = function() {
    var self = this;
    this.transaction(function(tx) {
      _.each(self.data.nodes, function(id) {
        tx.delete(id);
      });
    });
    this.documentDidLoad();
  };

  this.getEventProxy = function(name) {
    return this.eventProxies[name];
  };

  // Document manipulation
  //

  /**
   * @param beforeState object which will be used as before start of transaction
   * @param eventData object which will be used as payload for the emitted change event
   * @param transformation a function(tx) that performs actions on the transaction document tx
   *
   * @example
   * ```
   *   doc.transaction({ selection: sel }, {'event-hack': true}, function(tx, args) {
   *     tx.update(...);
   *     ...
   *     return {
   *       selection: newSelection
   *     };
   *   })
   * ```
   */
  this.transaction = function(beforeState, eventData, transformation) {
    if (arguments.length === 1) {
      transformation = arguments[0];
      eventData = {};
      beforeState = {};
    }
    if (arguments.length === 2) {
      transformation = arguments[1];
      eventData = {};
    } else {
      eventData = eventData || {};
    }
    if (!_.isFunction(transformation)) {
      throw new Error('Document.transaction() requires a transformation function.');
    }
    // var time = Date.now();
    // HACK: ATM we can't deep clone as we do not have a deserialization
    // for selections.
    var tx = this.startTransaction(_.clone(beforeState));
    // console.log('Starting the transaction took', Date.now() - time);
    try {
      // time = Date.now();
      var result = transformation(tx);
      // console.log('Executing the transformation took', Date.now() - time);
      var afterState = {};
      // only keys that are in the beforeState can be in the afterState
      // TODO: maybe this is to sharp?
      // we could also just merge the transformation result with beforeState
      // but then we might have non-state related information in the after state.
      for (var key in beforeState) {
        if (result[key]) {
          afterState[key] = result[key];
        } else {
          afterState[key] = beforeState[key];
        }
      }
      // save automatically if not yet saved or cancelled
      if (this.isTransacting) {
        tx.save(afterState, eventData);
      }
    } finally {
      tx.finish();
    }
  };

  this.startTransaction = function(beforeState) {
    if (this.isTransacting) {
      throw new Error('Nested transactions are not supported.');
    }
    this.isTransacting = true;
    // TODO: maybe we need to prepare the stage
    this.stage.before = beforeState || {};
    this.emit('transaction:started', this.stage);
    return this.stage;
  };

  this.create = function(nodeData) {
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      this.stage.create(nodeData);
    } else {
      if (this.stage) {
        this.stage.create(nodeData);
      }
      this._create(nodeData);
    }
    return this.data.get(nodeData.id);
  };

  this.delete = function(nodeId) {
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      this.stage.delete(nodeId);
    } else {
      if (this.stage) {
        this.stage.delete(nodeId);
      }
      this._delete(nodeId);
    }
  };

  this.set = function(path, value) {
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      this.stage.set(path, value);
    } else {
      if (this.stage) {
        this.stage.set(path, value);
      }
      this._set(path, value);
    }
  };

  this.update = function(path, diff) {
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      this.stage.update(path, diff);
    } else {
      this._update(path, diff);
      if (this.stage) {
        this.stage.update(path, diff);
      }
    }
  };

  this.undo = function() {
    var change = this.done.pop();
    if (change) {
      var inverted = change.invert();
      this._apply(inverted);
      this.undone.push(inverted);
      this._notifyChangeListeners(inverted, { 'replay': true });
    } else {
      console.error('No change can be undone.');
    }
  };

  this.redo = function() {
    var change = this.undone.pop();
    if (change) {
      var inverted = change.invert();
      this._apply(inverted);
      this.done.push(inverted);
      this._notifyChangeListeners(inverted, { 'replay': true });
    } else {
      console.error('No change can be redone.');
    }
  };

  // sel: PropertySelection
  // options:
  //   container: container instance
  //   type: string (annotation type filter)
  //
  // WARNING: Returns an empty array when selection is a container selection
  this.getAnnotationsForSelection = function(sel, options) {
    options = options || {};
    var annotations;
    var path, startOffset, endOffset;

    if (sel.isPropertySelection()) {
      path = sel.getPath();
      startOffset = sel.getStartOffset();
      endOffset = sel.getEndOffset();
    } else {
      return [];
    }
    annotations = this.annotationIndex.get(path, startOffset, endOffset);
    if (options.type) {
      annotations = _.filter(annotations, AnnotationIndex.filterByType(options.type));
    }
    return annotations;
  };

  // Attention: looking for container annotations is not as efficient
  // as property selections, as we do not have an index that has
  // notion of the spatial extend of an annotation
  // (which would depend on a model-side implementation of Container).
  // Opposed to that, common annotations are bound to properties which make it easy to lookup.
  this.getContainerAnnotationsForSelection = function(sel, container, options) {
    if (!container) {
      // Fail more silently
      return [];
      // throw new Error('Container required.');
    }
    var annotations;
    // Also look for container annotations if a Container instance is given
    if (options.type) {
      annotations = this.getIndex('type').get(options.type);
    } else {
      annotations = this.getIndex('container-annotation-anchors').byId;
    }
    annotations = _.filter(annotations, function(anno) {
      var annoSel = anno.getSelection();
      return sel.overlaps(annoSel);
    });
    return annotations;
  };

  this.getDocumentMeta = function() {
    return this.get('document');
  };

  this.getClipboardImporter = function() {
    return new ClipboardImporter({ schema: this.getSchema()});
  };

  this.getClipboardExporter = function() {
    return new ClipboardExporter();
  };

  /**
   * Enable or disable auto-attaching of nodes.
   * When this is enabled (default), a created node
   * gets attached to the document instantly.
   * Otherwise you need to take care of that yourself.
   *
   * Used internally e.g., by AbstractDocument.prototype.loadSeed()
   */
  this._setAutoAttach = function(val) {
    Document.super.prototype._setAutoAttach.call(this, val);
    this.stage._setAutoAttach(val);
  };


  this._saveTransaction = function(beforeState, afterState, info) {
    // var time = Date.now();
    if (!this.isTransacting) {
      throw new Error('Not in a transaction.');
    }
    this.isTransacting = false;
    var ops = this.stage.getOperations();
    if (ops.length > 0) {
      var documentChange = new DocumentChange(ops, beforeState, afterState);
      // apply the change
      this._apply(documentChange, 'skipStage');
      // push to undo queue and wipe the redo queue
      this.done.push(documentChange);
      this.undone = [];
      // console.log('Document._saveTransaction took %s ms', (Date.now() - time));
      // time = Date.now();
      this._notifyChangeListeners(documentChange, info);
      // console.log('Notifying change listener took %s ms', (Date.now() - time));
    }
  };

  this._cancelTransaction = function() {
    if (!this.isTransacting) {
      throw new Error('Not in a transaction.');
    }
    this.isTransacting = false;
  };

  this._apply = function(documentChange, mode) {
    if (this.isTransacting) {
      throw new Error('Can not replay a document change during transaction.');
    }
    // Note: we apply everything doubled, to keep the staging clone up2date.
    if (mode !== 'skipStage') {
      this.stage.apply(documentChange);
    }
    _.each(documentChange.ops, function(op) {
      this.data.apply(op);
      this._updateContainers(op);
      this.emit('operation:applied', op);
    }, this);
  };

  this._notifyChangeListeners = function(documentChange, info) {
    info = info || {};
    // HACK: update the container annotation index first
    // TODO: we should have a better concept to define the order of listeners
    // However, ContainerAnnotationIndex should be treated as an index
    // this order would suffice: [containers, indexes, ]
    this.containerAnnotationIndex.onDocumentChange(documentChange);
    this.emit('document:changed', documentChange, info, this);
  };

  this.updateEventProxies = function(documentChange, info) {
    _.each(this.eventProxies, function(proxy) {
      proxy.onDocumentChanged(documentChange, info, this);
    }, this);
  };
};

Substance.inherit(Document, AbstractDocument);

Object.defineProperty(Document.prototype, 'id', {
  get: function() {
    return this.getDocumentMeta().guid;
  },
  set: function() {
    throw new Error("Id is an immutable property.");
  }
});

module.exports = Document;
