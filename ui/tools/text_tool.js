'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var SurfaceTool = require('./surface_tool');
var _ = require('../../basics/helpers');

var TEXT_NODE_TYPES = ["paragraph", "heading", "blockquote", "codeblock"];

var TEXT_TYPES = {
  "paragraph": {label: 'Paragraph', data: {type: "paragraph"}},
  "heading1": {label: 'Heading 1', data: {type: "heading", level: 1}},
  "heading2": {label: 'Heading 2', data: {type: "heading", level: 2}},
  "heading3": {label: 'Heading 3', data: {type: "heading", level: 3}},
  "blockquote": {label: 'Blockquote', data: {type: "blockquote"}},
  "codeblock": {label: 'Codeblock', data: {type: "codeblock"}}
};

/**
 * Abstract class for text types
 * 
 * Implements the SurfaceTool API.
 */

function TextTool() {
  SurfaceTool.apply(this, arguments);
}

TextTool.Prototype = function() {

  this.update = function(sel, surface) {
    // Set disabled when not a property selection
    if (!surface.isEnabled() || sel.isNull()) {
      return this.setDisabled();
    }
    if (sel.isTableSelection()) {
      return this.setState({
        disabled: true,
        currentContext: 'table'
      });
    } else if (sel.isContainerSelection()) {
      return this.setState({
        disabled: true,
        currentContext: 'container'
      });
    }

    var doc = this.getDocument();
    var path = sel.getPath();
    var node = doc.get(path[0]);
    var textType = this.getTextType(node);
    var parentNode = node.getRoot();
    var currentContext = this.getContext(parentNode, path);

    var newState = {
      sel: sel,
      disabled: !textType,
      currentTextType: textType,
      currentContext: currentContext,
    };

    this.setState(newState);
  };

  this.getContext = function(parentNode, path) {
    if (parentNode.id === path[0]) {
      return path[1];
    } else {
      return parentNode.type;
    }
  };

  this.getAvailableTextTypes = function() {
    return TEXT_TYPES;
  };

  this.isTextType = function(type) {
    return TEXT_NODE_TYPES.indexOf(type) >= 0;
  };

  // Get text type for a given node
  this.getTextType = function(node) {
    if (this.isTextType(node.type)) {
      var textType = node.type;
      if (textType === "heading") {
        textType += node.level;
      }
      return textType;
    }
  };

  this.switchTextType = function(textTypeName) {
    if (this.isDisabled()) return;

    var textType = TEXT_TYPES[textTypeName];
    var surface = this.getSurface();
    var editor = surface.getEditor();

    surface.transaction(function(tx, args) {
      args.data = textType.data;
      return editor.switchType(tx, args);
    });
  };

  // UI Specific parts
  // ----------------

  this.render = function() {
    var textTypes = this.getAvailableTextTypes();
    var el = $$("div")
      .addClass('text-tool-component select');

    // Note: this is a view internal state for opening the select dropdown
    if (this.state.open) {
      el.addClass('open');
    }
    if (this.state.disabled) {
      el.addClass('disabled');
    }
    // label/dropdown button
    var isTextContext = textTypes[this.state.currentTextType];
    var label;
    if (isTextContext) {
      label = textTypes[this.state.currentTextType].label;
    } else if (this.state.currentContext) {
      label = this.state.currentContext; // i18n.t(this.state.currentContext);
    } else {
      label = 'No selection';
    }
    el.append($$('button')
      .addClass("toggle small").attr('href', "#")
      .attr('title', this.props.title)
      .append(label)
      .on('mousedown', this.toggleAvailableTextTypes)
      .on('click', this.handleClick)
    );
    // dropdown options
    var options = $$('div').addClass("options shadow border fill-white");
    _.each(textTypes, function(textType, textTypeId) {
      var button = $$('button')
          .addClass('option '+textTypeId)
          .attr("data-type", textTypeId)
          .append(textType.label)
          .on('click', this.handleClick)
          .on('mousedown', this.handleSwitchTextType);
      options.append(button);
    }, this);
    el.append(options);
    return el;
  };


  this.handleClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  this.handleSwitchTextType = function(e) {
    e.preventDefault();
    // Modifies the tool's state so that state.open is undefined, which is nice
    // because it means the dropdown will be closed automatically
    this.switchTextType(e.currentTarget.dataset.type);
  };

  this.toggleAvailableTextTypes = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.isDisabled()) return;
    // HACK: This only updates the view state state.open is not set on the tool itself
    // That way the dropdown automatically closes when the selection changes
    this.toggleDropdown();
  };

  this.toggleDropdown = function() {
    this.extendState({
      open: !this.state.open
    });
  };
};

OO.inherit(TextTool, SurfaceTool);

module.exports = TextTool;
