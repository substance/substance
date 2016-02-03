'use strict';

var SurfaceCommand = require('../../ui/SurfaceCommand');
var _isMatch = require('lodash/lang/isMatch');
var _find = require('lodash/collection/find');
var _clone = require('lodash/lang/clone');

var SwitchTextType = function(surface) {
  SurfaceCommand.call(this, surface);
};

SwitchTextType.Prototype = function() {

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  // Available text types on the surface
  this.getTextTypes = function() {
    var surface = this.getSurface();
    if (surface.isContainerEditor()) {
      return surface.getTextTypes();
    } else {
      return [];
    }
  };

  this.getTextType = function(textTypeName) {
    var textTypes = this.getTextTypes();
    return _find(textTypes, function(t) {
      return t.name === textTypeName;
    });
  };

  // Search which textType matches the current node
  // E.g. {type: 'heading', level: 1} => heading1
  this.getCurrentTextType = function(node) {
    var textTypes = this.getTextTypes();
    var currentTextType;
    textTypes.forEach(function(textType) {
      var nodeProps = _clone(textType.data);
      delete nodeProps.type;
      if (_isMatch(node, nodeProps) && node.type === textType.data.type) {
        currentTextType = textType;
      }
    });
    return currentTextType;
  };

  this.getCommandState = function() {
    var sel = this.getSelection();
    var surface = this.getSurface();

    var newState = {
      disabled: false,
      sel: sel,
      textTypes: this.getTextTypes()
    };

    // Set disabled when not a property selection
    if (!surface.isEnabled() || sel.isNull()) {
      newState.disabled = true;
    } else if (sel.isContainerSelection()) {
      newState.disabled = true;
      newState.currentTextType = {name: 'container-selection'};
    } else {
      var doc = this.getDocument();
      var path = sel.getPath();
      var node = doc.get(path[0]);
      // There are cases where path points to an already deleted node,
      // so we need to guard node
      if (node) {
        if (node.isText() && node.isBlock()) {
          newState.currentTextType = this.getCurrentTextType(node);
        }
        if (!newState.currentTextType) {
          // We 'abuse' the currentTextType field by providing a property
          // identifier that is translated into a name using an i18n resolve.
          // E.g. this.i18n('figure.caption') -> Figre Caption
          newState.currentTextType = {name: [node.type, path[1]].join('.')};
          newState.disabled = true;
        }
      }
    }
    return newState;
  };

  /**
    Trigger a switchTextType transaction

    @param {String} textTypeName identifier (e.g. heading1)
  */
  this.execute = function(textTypeName) {
    var textType = this.getTextType(textTypeName);
    var nodeData = textType.data;
    var surface = this.getSurface();
    surface.transaction(function(tx, args) {
      args.data = nodeData;
      return surface.switchType(tx, args);
    });
    return nodeData;
  };
};

SurfaceCommand.extend(SwitchTextType);
SwitchTextType.static.name = 'switch-text-type';

module.exports = SwitchTextType;
