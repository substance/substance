/* jshint latedef:nofunc */
'use strict';

var AnnotatedTextComponent = require('./AnnotatedTextComponent');
var Component = require('./Component');
var $$ = Component.$$;
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

  this.render = function() {
    var path = this.props.path;

    var el = this._renderContent()
      .addClass('sc-text-property')
      .attr({
        "data-path": path.join('.'),
        spellCheck: false,
      })
      .css({
        whiteSpace: "pre-wrap"
      });
    el.append($$('br'));
    return el;
  };

  this._renderFragment = function(fragment) {
    var node = fragment.node;
    var id = node.id;
    var el;
    if (node.type === 'cursor') {
      el = $$('span').addClass('se-cursor');
    } else if (node.type === 'selection-fragment') {
      el = $$('span').addClass('se-selection-fragment');
    } else {
      el = _super._renderFragment.call(this, fragment);
      if (node.constructor.static.isInline) {
        el.attr({
          'contentEditable': false,
          'data-inline':'1',
          'data-length': 1
        });
      }
      // adding refs here, enables preservative rerendering
      // TODO: while this solves problems with rerendering inline nodes
      // with external content, it decreases the overall performance too much.
      // We should optimize the component first before we can enable this.
      if (this.context.config && this.context.config.preservativeTextPropertyRendering) {
        el.ref(id + "@" + fragment.counter);
      }
    }
    el.attr('data-offset', fragment.pos);
    return el;
  };

  this._finishFragment = function(fragment, context, parentContext) {
    context.attr('data-length', fragment.length);
    parentContext.append(context);
  };

  this.didMount = function() {
    var surface = this.getSurface();
    if (surface) {
      surface._registerTextProperty(this.props.path, this);
    }
  };

  this.dispose = function() {
    _super.dispose.call(this);
    var surface = this.getSurface();
    if (surface) {
      surface._unregisterTextProperty(this.props.path, this);
    }
  };

  this.getText = function() {
    return this.getDocument().get(this.props.path);
  };

  this.getAnnotations = function() {
    var annotations = this.getDocument().getIndex('annotations').get(this.props.path);
    var fragments = this.getSurface()._getFragments(this.props.path);
    if (fragments) {
      annotations = annotations.concat(fragments);
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
    for (var child = el.firstChild; child; child=child.nextSibling, idx++) {
      if (child.nodeType === 3) {
        l = child.length;
        if (l >= charPos) {
          return {
            container: child,
            offset: charPos
          };
        } else {
          charPos -= l;
        }
      } else if (child.nodeType === 1) {
        if (child.dataset && child.dataset.length) {
          l = parseInt(child.dataset.length, 10);
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
  var path = _getPath(root, node);
  if (!path) {
    return null;
  }
  var charPos = _getCharPos(node, offset);
  return new Coordinate(path, charPos);
};

function _getPath(root, node) {
  while (true) {
    if (!node || node === root) {
      return null;
    }
    if (node.nodeType === 1) {
      if (node.dataset && node.dataset.path) {
        return node.dataset.path.split('.');
      }
      if (node.dataset && node.dataset.path) {
        return node.dataset.path.split('.');
      }
    }
    node = node.parentNode;
  }
}

function _getCharPos(node, offset) {
  var charPos = offset;
  var parent;
  // Cases:
  // 1. node is a text node and has no previous sibling
  // => parent is either the property or an annotation
  if (node.nodeType === 3) {
    if (offset === -1) {
      charPos = node.length;
    }
    if (!node.previousSibling) {
      parent = node.parentNode;
      if (parent.dataset.hasOwnProperty('offset')) {
        charPos += parseInt(parent.dataset.offset, 10);
      }
    } else {
      node = node.previousSibling;
      charPos += _getCharPos(node, -1);
    }
  } else if (node.nodeType === 1 && offset === -1) {
    if (node.dataset && node.dataset.length) {
      charPos = parseInt(node.dataset.offset, 10) + parseInt(node.dataset.length, 10);
    } else {
      // Unsupported case
      return null;
    }
  } else {
    // Unsupported case
    return null;
  }
  return charPos;
}

module.exports = TextPropertyComponent;
