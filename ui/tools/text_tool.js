'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var SurfaceTool = require('./surface_tool');
var _ = require('../../basics/helpers');

/**
 * Abstract class for text types
 * 
 * Implements the SurfaceTool API.
 */

function TextTool() {
  SurfaceTool.apply(this, arguments);
}

TextTool.Prototype = function() {

  this.getTextCommands = function() {
    var surface = this.getSurface();
    if (!this.textCommands && surface) {
      this.textCommands = surface.getTextCommands();  
    }
    return this.textCommands || {};
  };

  this.isTextType = function(type) {
    var isTextType = false;
    var textCommands = this.getTextCommands();
    _.each(textCommands, function(cmd) {
      if (cmd.constructor.static.nodeData.type === type) {
        isTextType = true;
      }
    });
    return isTextType;
  };

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
    var commandName = this.getCommandName(node);
    var parentNode = node.getRoot();
    var currentContext = this.getContext(parentNode, path);

    var newState = {
      sel: sel,
      disabled: !commandName,
      currentCommand: commandName,
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

  this.getCommandName = function(node) {
    if (this.isTextType(node.type)) {
      var textType = "make"+_.capitalize(node.type);
      if (node.type === "heading") {
        textType += node.level;
      }
      return textType;
    }
  };

  // UI Specific parts
  // ----------------

  this.render = function() {

    // Available text commands
    var textCommands = this.getTextCommands();

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
    var isTextContext = textCommands[this.state.currentCommand];
    var label;
    if (isTextContext) {
      label = textCommands[this.state.currentCommand].constructor.static.textTypeName;
    } else if (this.state.currentContext) {
      label = this.state.currentContext;
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
    _.each(textCommands, function(textCommand, commandName) {
      var button = $$('button')
          .addClass('option '+commandName)
          .attr("data-type", commandName)
          .append(textCommand.constructor.static.textTypeName)
          .on('click', this.handleClick)
          .on('mousedown', this.handleMouseDown);
      options.append(button);
    }, this);

    el.append(options);
    return el;
  };

  this.handleClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  this.handleMouseDown = function(e) {
    e.preventDefault();
    // Modifies the tool's state so that state.open is undefined, which is nice
    // because it means the dropdown will be closed automatically
    this.executeCommand(e.currentTarget.dataset.type);
  };

  this.executeCommand = function(commandName) {
    this.getSurface().executeCommand(commandName);
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
