import EventEmitter from '../util/EventEmitter'
import Anchor from './Anchor'

/**
  A document selection. Refers to a Substance document model, not to the DOM.

  Implemented by {@link model/PropertySelection} and {@link model/ContainerSelection}

  @class
  @abstract
*/

class Selection {

  constructor() {
    // Internal stuff
    var _internal = {};
    Object.defineProperty(this, "_internal", {
      enumerable: false,
      value: _internal
    });
      // set when attached to document
    _internal.doc = null;
  }

  // for duck-typed instanceof
  get _isSelection() { return true; }

  clone() {
    var newSel = this._clone();
    if (this._internal.doc) {
      newSel.attach(this._internal.doc);
    }
    return newSel;
  }

  /**
    @returns {Document} The attached document instance
  */
  getDocument() {
    var doc = this._internal.doc;
    if (!doc) {
      throw new Error('Selection is not attached to a document.');
    }
    return doc;
  }

  isAttached() {
    return Boolean(this._internal.doc);
  }

  /**
    Attach document to the selection.

    @private
    @param {Document} doc document to attach
    @returns {this}
  */
  attach(doc) {
    this._internal.doc = doc;
    return this;
  }

  /**
    @returns {Boolean} true when selection is null.
  */
  isNull() { return false; }

  /**
    @returns {Boolean} true for property selections
  */
  isPropertySelection() { return false; }

  /**
    @returns {Boolean} true if selection is a {@link model/ContainerSelection}
  */
  isContainerSelection() { return false; }

  /**
    @returns {Boolean} true if selection is a {@link model/NodeSelection}
  */
  isNodeSelection() { return false; }

  isCustomSelection() { return false; }

  /**
    @returns {Boolean} true when selection is collapsed
  */
  isCollapsed() { return true; }

  /**
    @returns {Boolean} true if startOffset < endOffset
  */
  isReverse() { return false; }

  getType() {
    throw new Error('Selection.getType() is abstract.');
  }

  /**
    @returns {Boolean} true if selection equals `other` selection
  */
  equals(other) {
    if (this === other) {
      return true ;
    } else if (!other) {
      return false;
    } else if (this.isNull() !== other.isNull()) {
      return false;
    } else if (this.getType() !== other.getType()) {
      return false;
    } else {
      // Note: returning true here, so that sub-classes
      // can call this as a predicate in their expression
      return true;
    }
  }

  /**
    @returns {String} This selection as human readable string.
  */
  toString() {
    return "null";
  }

  /**
    Convert container selection to JSON.

    @abstract
    @returns {Object}
  */
  toJSON() {
    throw new Error('This method is abstract.');
  }

  /**
    Get selection fragments for this selection.

    A selection fragment is bound to a single property.
    @returns {Selection.Fragment[]}
  */
  getFragments() {
    return [];
  }
}

/**
  Class to represent null selections.

  @private
  @class
*/

class NullSelection extends Selection {

  isNull() {
    return true;
  }

  getType() {
    return 'null';
  }

  toJSON() {
    return null;
  }

  clone() {
    return this;
  }
}

/**
  We use a singleton to represent NullSelections.

  @type {model/Selection}
*/

Selection.nullSelection = Object.freeze(new NullSelection());

/**
  A selection fragment. Used when we split a {@link model/ContainerSelection}
  into their fragments, each corresponding to a property selection.

  @private
  @class
*/

Selection.Fragment = function(path, startOffset, endOffset, full) {
  EventEmitter.call(this);

  this.type = "selection-fragment";
  this.path = path;
  this.startOffset = startOffset;
  this.endOffset = endOffset || startOffset;
  this.full = Boolean(full);
};

Selection.Fragment.Prototype = function() {

  this.isAnchor = function() {
    return false;
  };

  this.isInline = function() {
    return false;
  };

  this.isPropertyFragment = function() {
    return true;
  };

  this.isNodeFragment = function() {
    return false;
  };

  this.isFull = function() {
    return this.full;
  };

  this.isPartial = function() {
    return !this.full;
  };

  this.getNodeId = function() {
    return this.path[0];
  };

};

EventEmitter.extend(Selection.Fragment);


Selection.NodeFragment = function(nodeId) {
  EventEmitter.call(this);

  this.type = "node-fragment";
  this.nodeId = nodeId;
  this.path = [nodeId];
};

Selection.NodeFragment.Prototype = function() {

  this.isAnchor = function() {
    return false;
  };

  this.isInline = function() {
    return false;
  };

  this.isPropertyFragment = function() {
    return false;
  };

  this.isNodeFragment = function() {
    return true;
  };

  this.isFull = function() {
    return true;
  };

  this.isPartial = function() {
    return false;
  };

  this.getNodeId = function() {
    return this.nodeId;
  };
};

EventEmitter.extend(Selection.NodeFragment);


/**
  Describe the cursor when creating selection fragments.
  This is used for rendering selections.

  @private
  @class
  @extends Anchor
*/
Selection.Cursor = function(path, offset) {
  Anchor.call(this, path, offset);
  this.type = "cursor";
};

Selection.Cursor.Prototype = function() {

  this.isPropertyFragment = function() {
    return false;
  };

  this.isNodeFragment = function() {
    return false;
  };

};

Anchor.extend(Selection.Cursor);

export default Selection