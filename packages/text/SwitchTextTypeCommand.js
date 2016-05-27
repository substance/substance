'use strict';

var Command = require('../../ui/Command');
var _isMatch = require('lodash/isMatch');
var _find = require('lodash/find');
var _clone = require('lodash/clone');

function SwitchTextType() {
  Command.apply(this, arguments);
}

SwitchTextType.Prototype = function() {

  // Available text types on the surface
  this.getTextTypes = function(context) {
    var surface = context.surface;
    if (surface.isContainerEditor()) {
      return surface.getTextTypes();
    } else {
      return [];
    }
  };

  this.getTextType = function(context, textTypeName) {
    var textTypes = this.getTextTypes(context);
    return _find(textTypes, function(t) {
      return t.name === textTypeName;
    });
  };

  // Search which textType matches the current node
  // E.g. {type: 'heading', level: 1} => heading1
  this.getCurrentTextType = function(context, node) {
    var textTypes = this.getTextTypes(context);
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

  this.getCommandState = function(context) {
    var sel = context.documentSession.getSelection();
    var surface = context.surface;
    var doc = context.document;

    if (!surface) {
      return {
        disabled: true,
        active: false
      };
    }

    var newState = {
      disabled: false,
      sel: sel,
      textTypes: this.getTextTypes(context)
    };

    // Set disabled when not a property selection
    if (!surface.isEnabled() || sel.isNull()) {
      newState.disabled = true;
    } else if (sel.isContainerSelection()) {
      newState.disabled = true;
      newState.currentTextType = {name: 'container-selection'};
    } else {
      var path = sel.getPath();
      var node = doc.get(path[0]);
      // There are cases where path points to an already deleted node,
      // so we need to guard node
      if (node) {
        if (node.isText() && node.isBlock()) {
          newState.currentTextType = this.getCurrentTextType(context, node);
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
  this.execute = function(context, textTypeName) {
    var textType = this.getTextType(context, textTypeName);
    var nodeData = textType.data;
    var surface = context.surface;
    surface.transaction(function(tx, args) {
      args.data = nodeData;
      return surface.switchType(tx, args);
    });
    return nodeData;
  };
};

Command.extend(SwitchTextType);
SwitchTextType.static.name = 'switch-text-type';

module.exports = SwitchTextType;
