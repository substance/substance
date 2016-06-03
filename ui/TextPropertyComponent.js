/* jshint latedef:nofunc */
'use strict';

var isNumber = require('lodash/isNumber');
var AnnotatedTextComponent = require('./AnnotatedTextComponent');
var Coordinate = require('../model/Coordinate');

/**
  Renders a text property. Used internally by different components to render editable text.

  @class
  @component
  @extends ui/AnnotatedTextComponent

  @prop {String[]} path path to a text property
  @prop {String} [tagName] specifies which tag should be used - defaults to `div`

  @example

  ```js
  $$(TextProperty, {
    path: [ 'paragraph-1', 'content']
  })
  ```
*/

function TextPropertyComponent() {
  TextPropertyComponent.super.apply(this, arguments);
}

TextPropertyComponent.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  this.didMount = function() {
    _super.didMount.call(this);
    var surface = this.getSurface();
    if (surface) {
      surface._registerTextProperty(this);
    }
  };

  this.dispose = function() {
    _super.dispose.call(this);
    var surface = this.getSurface();
    if (surface) {
      surface._unregisterTextProperty(this);
    }
  };

  this.render = function($$) {
    var path = this.getPath();

    var el = this._renderContent($$)
      .addClass('sc-text-property')
      .attr({
        'data-path': path.join('.'),
        spellCheck: false,
      })
      .css({
        'white-space': 'pre-wrap'
      });

    el.append($$('br'));
    return el;
  };

  this._renderFragment = function($$, fragment) {
    var node = fragment.node;
    var id = node.id;
    var el;
    if (node.type === 'cursor' || node.type === 'selection-fragment') {
      el = $$('span').addClass('se-'+node.type);

      if (node.type === 'cursor') {
        // Add zero-width character. Since we have a non-empty element, the
        // outline style set on the cursor would not be visible in certain
        // scenarios (e.g. when cursor is at the very beginning of a text.
        el.append("\uFEFF");
        el.append($$('div').addClass('se-cursor-inner'));
      }

      if (node.collaborator) {
        el.addClass('sm-collaborator-'+node.collaborator.colorIndex);
      } else {
        el.addClass('sm-local-user');
      }
    } else {
      el = _super._renderFragment.apply(this, arguments);
      if (node.constructor.static.isInline) {
        el.attr({
          'contentEditable': false,
          'data-inline':'1',
          'data-length': 1
        });
      }
      // Adding refs here, enables preservative rerendering
      // TODO: while this solves problems with rerendering inline nodes
      // with external content, it decreases the overall performance too much.
      // We should optimize the component first before we can enable this.
      if (this.context.config && this.context.config.preservativeTextPropertyRendering) {
        el.ref(id + '@' + fragment.counter);
      }
    }
    el.attr('data-offset', fragment.pos);
    return el;
  };

  this._finishFragment = function(fragment, context, parentContext) {
    context.attr('data-length', fragment.length);
    parentContext.append(context);
  };

  this.getPath = function() {
    return this.props.path;
  };

  this.getText = function() {
    return this.getDocument().get(this.getPath());
  };

  this.getAnnotations = function() {
    var path = this.getPath();
    var annotations = this.getDocument().getIndex('annotations').get(path);
    var surface = this.getSurface();
    if (surface) {
      var fragments = surface._getFragments(path);
      if (fragments) {
        annotations = annotations.concat(fragments);
      }
    }
    return annotations;
  };

  this.setFragments = function() {
    this.children[0].extendProps({ annotations: this.getAnnotations() });
  };

  this.getDocument = function() {
    return this.props.doc ||this.context.doc;
  };

  this.getController = function() {
    return this.props.controller || this.context.controller;
  };

  this.getSurface = function() {
    return this.props.surface ||this.context.surface;
  };

  this.isEditable = function() {
    return this.getSurface().isEditable();
  };

  this.isReadonly = function() {
    return this.getSurface().isReadonly();
  };

  this.getDOMCoordinate = function(charPos) {
    return this._getDOMCoordinate(this.el, charPos);
  };

  this._getDOMCoordinate = function(el, charPos) {
    var l;
    var idx = 0;
    if (charPos === 0) {
      return {
        container: el.getNativeElement(),
        offset: 0
      };
    }
    for (var child = el.getFirstChild(); child; child=child.getNextSibling(), idx++) {
      if (child.isTextNode()) {
        l = child.textContent.length;
        if (l >= charPos) {
          return {
            container: child.getNativeElement(),
            offset: charPos
          };
        } else {
          charPos -= l;
        }
      } else if (child.isElementNode()) {
        var length = child.getAttribute('data-length');
        if (length) {
          l = parseInt(length, 10);
          if (l>= charPos) {
            return this._getDOMCoordinate(child, charPos, idx);
          } else {
            charPos -= l;
          }
        } else {
          console.error('FIXME: Can not map to DOM coordinates.');
          return null;
        }
      }
    }
  };
};

AnnotatedTextComponent.extend(TextPropertyComponent);

// Helpers for DOM selection mapping

TextPropertyComponent.getCoordinate = function(root, node, offset) {
  var context = _getPropertyContext(root, node, offset);
  if (!context) {
    return null;
  }
  // in some cases we need to normalize the DOM coordinate
  // before we can use it for retrieving charPos
  // E.g. observed with #273
  node = context.node;
  offset = context.offset;
  var charPos = _getCharPos(context.node, context.offset);
  if (isNumber(charPos)) {
    return new Coordinate(context.path, charPos);
  }
  return null;
};

function _getPropertyContext(root, node, offset) {
  var result = {
    el: null,
    path: null,
    node: node,
    offset: offset
  };
  while (true) {
    if (!node || node === root) {
      return null;
    }
    if (node.isElementNode()) {
      var path = node.getAttribute('data-path');
      if (path) {
        result.el = node;
        result.path = path.split('.');
        return result;
      }
      if (node.getAttribute('data-inline')) {
        // we need to normalize situations where the DOM coordinate
        // is inside an inline node, which we have observed
        // can actually happen.
        result.node = node;
        if (offset > 0) {
          result.offset = 1;
        }
      }
    }
    node = node.getParent();
  }
  return null;
}

function _getCharPos(node, offset) {
  var charPos = offset;
  var parent, childIdx;

  /*
    In the following implementation we are exploiting two facts
    for optimization:
    - an element with data-path is assumed to be the text property element
    - an element with data-offset is assumed to be an annotation element

    Particularly, the data-offset property is helpful to get the character position
    in just one iteration.
  */

  parent = node.getParent();
  if (node.isTextNode()) {
    // TextNode is first child
    if (node === parent.firstChild) {
      // ... we can stop if parent is text property
      var parentPath = parent.getAttribute('data-path');
      var parentOffset = parent.getAttribute('data-offset');
      if (parentPath) {
        charPos = offset;
      }
      // ... and we can stop if parent has an offset hint
      else if (parentOffset) {
        charPos = parseInt(parentOffset, 10) + offset;
      }
      // ... otherwise we count the charPos by recursing up-tree
      else {
        charPos = _getCharPos(parent, 0) + offset;
      }
    } else {
      // the node has a predecessor so we can apply recurse using the child index
      childIdx = parent.getChildIndex(node);
      charPos = _getCharPos(parent, childIdx) + offset;
    }
  } else if (node.isElementNode()) {
    var pathStr = node.getAttribute('data-path');
    var offsetStr = node.getAttribute('data-offset');
    // if node is the element of a text property, then offset is a child index
    // up to which we need to sum up all lengths
    if (pathStr) {
      charPos = _countCharacters(node, offset);
    }
    // similar if node is the element of an annotation, and we can use the
    // element's offset
    else if (offsetStr) {
      childIdx = parent.getChildIndex(node);
      charPos = parseInt(offsetStr, 10) + _countCharacters(node, offset);
    }
    // for other elements we need to count characters in the child tree
    // adding the offset of this element which needs to be computed by recursing up-tree
    else {
      childIdx = parent.getChildIndex(node);
      charPos = _getCharPos(parent, childIdx) + _countCharacters(node, offset);
    }
  } else {
    // Unsupported case
    return null;
  }
  return charPos;
}

function _countCharacters(el, maxIdx) {
  var charPos = 0;
  // inline elements have a length of 1
  if (el.getAttribute('data-inline')) {
    return maxIdx === 0 ? 0 : 1;
  }
  var l = el.getChildCount();
  if (arguments.length === 1) {
    maxIdx = l;
  }
  maxIdx = Math.min(l, maxIdx);
  for (var i=0, child = el.getFirstChild(); i < maxIdx; child = child.getNextSibling(), i++) {
    if (child.isTextNode()) {
      charPos += child.getTextContent().length;
    } else if (child.isElementNode()) {
      var length = child.getAttribute('data-length');
      if (child.getAttribute('data-inline')) {
        charPos += 1;
      } else if (length) {
        charPos += parseInt(length, 10);
      } else {
        charPos += _countCharacters(child);
      }
    }
  }
  return charPos;
}

module.exports = TextPropertyComponent;
