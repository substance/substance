'use strict';

var isEqual = require('lodash/isEqual');
var isArray = require('lodash/isArray');
var isObject = require('lodash/isObject');
var isString = require('lodash/isString');
var oo = require('../util/oo');
var EventEmitter = require('../util/EventEmitter');
var Coordinate = require('./Coordinate');
var Range = require('./Range');
var Anchor = require('./Anchor');

/**
  A document selection. Refers to a Substance document model, not to the DOM.

  Implemented by {@link model/PropertySelection} and {@link model/ContainerSelection}

  @class
  @abstract
*/

function Selection() {
  // Internal stuff
  var _internal = {};
  Object.defineProperty(this, "_internal", {
      enumerable: false,
      value: _internal
  });
    // set when attached to document
  _internal.doc = null;
}

Selection.Prototype = function() {

  /**
    @returns {Document} The attached document instance
  */
  this.getDocument = function() {
    var doc = this._internal.doc;
    if (!doc) {
      throw new Error('Selection is not attached to a document.');
    }
    return doc;
  };

  /**
    Attach document to the selection.

    @private
    @param {Document} doc document to attach
    @returns {this}
  */
  this.attach = function(doc) {
    this._internal.doc = doc;
    return this;
  };

  /**
    @returns {Boolean} true when selection is null.
  */
  this.isNull = function() {
    return false;
  };

  /**
    @returns {Boolean} true for property selections
  */
  this.isPropertySelection = function() {
    return false;
  };

  /**
    @returns {Boolean} true if selection is a {@link model/ContainerSelection}
  */
  this.isContainerSelection = function() {
    return false;
  };

  this.isCustomSelection = function() {
    return false;
  };

  /**
    @returns {Boolean} true if selection is a {@link model/TableSelection}
  */
  this.isTableSelection = function() {
    return false;
  };

  /**
    @returns {Boolean} true when selection is collapsed
  */
  this.isCollapsed = function() {
    return true;
  };

  /**
    @returns {Boolean} true if startOffset < endOffset
  */
  this.isReverse = function() {
    return false;
  };

  /**
    @returns {Boolean} true if selection equals `other` selection
  */
  this.equals = function(other) {
    if (this === other) {
      return true ;
    } else if (!other) {
      return false;
    } else if (this.isNull() !== other.isNull()) {
      return false;
    } else {
      // Note: returning true here, so that sub-classes
      // can call this as a predicate in their expression
      return true;
    }
  };

  /**
    @returns {String} This selection as human readable string.
  */
  this.toString = function() {
    return "null";
  };

  /**
    Convert container selection to JSON.

    @abstract
    @returns {Object}
  */
  this.toJSON = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Get selection fragments for this selection.

    A selection fragment is bound to a single property.
    @returns {Selection.Fragment[]}
  */
  this.getFragments = function() {
    return [];
  };

};

oo.initClass(Selection);

/**
  Class to represent null selections.

  @private
  @class
*/

Selection.NullSelection = function() {
  Selection.call(this);
};

Selection.NullSelection.Prototype = function() {
  this.isNull = function() {
    return true;
  };

  this.toJSON = function() {
    return null;
  };

  this.clone = function() {
    return this;
  };
};

Selection.extend(Selection.NullSelection);

/**
  We use a singleton to represent NullSelections.

  @type {model/Selection}
*/

Selection.nullSelection = Object.freeze(new Selection.NullSelection());

Selection.fromJSON = function(json) {
  if (!json) {
    return Selection.nullSelection;
  }
  var type = json.type;
  switch(type) {
    case 'property':
      var PropertySelection = require('./PropertySelection');
      return PropertySelection.fromJSON(json);
    case 'container':
      var ContainerSelection = require('./ContainerSelection');
      return ContainerSelection.fromJSON(json);
    case 'custom':
      var CustomSelection = require('./CustomSelection');
      return CustomSelection.fromJSON(json);
    case 'default':
      // TODO: what if we have custom selections?
      console.error('Selection.fromJSON(): unsupported selection data', json);
      return Selection.nullSelection;
  }
};

Selection.create = function() {
  var PropertySelection = require('./PropertySelection');
  var ContainerSelection = require('./ContainerSelection');
  var coor, range;
  if (arguments.length === 1 && arguments[0] === null) {
    return Selection.nullSelection;
  }
  var sel;
  if (arguments[0] instanceof Coordinate) {
    coor = arguments[0];
    sel = new PropertySelection(coor.start.path, coor.start.offset, coor.end.offset, false);
  } else if (arguments[0] instanceof Range) {
    range = arguments[0];
    if (isEqual(range.start.path, range.end.path)) {
      sel = new PropertySelection(range.start.path, range.start.offset, range.end.offset, range.reverse);
    } else {
      sel = new ContainerSelection(range.containerId, range.start.path, range.start.offset, range.end.path, range.end.offset, range.isReverse);
    }
  } else if (arguments.length === 1 && isObject(arguments[0])) {
    var json = arguments[0];
    switch(json.type) {
      case 'property':
        sel = new PropertySelection.fromJSON(json);
        break;
      case 'container':
        sel = new ContainerSelection.fromJSON(json);
        break;
      default:
        throw new Error('Unsupported selection type', json.type);
    }
  }
  // createSelection(startPath, startOffset)
  else if (arguments.length === 2 && isArray(arguments[0])) {
    sel = new PropertySelection(arguments[0], arguments[1], arguments[1]);
  }
  // createSelection(startPath, startOffset, endOffset)
  else if (arguments.length === 3 && isArray(arguments[0])) {
    sel = new PropertySelection(arguments[0], arguments[1], arguments[2]);
  }
  // createSelection(containerId, startPath, startOffset, endPath, endOffset)
  else if (arguments.length === 5 && isString(arguments[0])) {
    sel = new ContainerSelection(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
  } else {
    console.error('Illegal arguments for Selection.create().', arguments);
    sel = Selection.nullSelection;
  }
  return sel;
};


/**
  A selection fragment. Used when we split a {@link model/ContainerSelection}
  into their fragments, each corresponding to a property selection.

  @private
  @class
*/

Selection.Fragment = function(path, startOffset, endOffset) {
  EventEmitter.call(this);

  this.type = "selection-fragment";
  this.path = path;
  this.startOffset = startOffset;
  this.endOffset = endOffset || startOffset;
};

Selection.Fragment.Prototype = function() {

  this.isAnchor = function() {
    return false;
  };

  this.isInline = function() {
    return false;
  };

};

EventEmitter.extend(Selection.Fragment);

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

Anchor.extend(Selection.Cursor);

module.exports = Selection;
