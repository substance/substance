'use strict';

var oo = require('../../util/oo');
var SurfaceCommand = require('../../ui/SurfaceCommand');
var _isMatch = require('lodash/lang/isMatch');
var _find = require('lodash/collection/find');
var TextNode = require('../../model/TextNode');

var SwitchTextType = function(surface) {
  SurfaceCommand.call(this, surface);
};

SwitchTextType.Prototype = function() {
  this.static = {
    name: 'switchTextType'
  };

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  // Available text types on the surface
  this.getTextTypes = function() {
    return this.getSurface().getTextTypes();
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
      if (_isMatch(node.properties, textType.data)) {
        currentTextType = textType;
      }
    });
    return currentTextType;
  };

  // Block nodes are all nodes that are listed in a container
  // Thus have no parent
  this.isBlock = function(node) {
    // TODO: this needs a better checker
    return !node.hasParent();
  };

  this.isText = function(node) {
    return node instanceof TextNode;
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
    } else if (sel.isTableSelection()) {
      newState.disabled = true;
      // newState.currentContext = 'table';
    } else if (sel.isContainerSelection()) {
      newState.disabled = true;
      // newState.currentContext = 'container';
    } else {
      var doc = this.getDocument();
      var path = sel.getPath();
      var node = doc.get(path[0]);

      if (node && this.isBlock(node) && this.isText(node)) {
        newState.currentTextType = this.getCurrentTextType(node);
        if (!newState.currentTextType) {
          newState.disabled = true;
        }
      } else {
        newState.disabled = true;
      }
    }
    return newState;
  };

  // Execute command and trigger
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

oo.inherit(SwitchTextType, SurfaceCommand);

module.exports = SwitchTextType;
