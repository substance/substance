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
  this.context.toolManager.registerTool(this);
}

TextTool.Prototype = function() {

  this.static = {
    name: 'switchTextType',
    command: 'switchTextType'
  };

  this.getInitialState = function() {
    var state = this.context.toolManager.getCommandState(this);
    return state;
  };

  this.getTextCommands = function() {
    var surface = this.getSurface();
    if (!this.textCommands && surface) {
      this.textCommands = surface.getTextCommands();  
    }
    return this.textCommands || {};
  };

  this.dispose = function() {
    this.context.toolManager.unregisterTool(this);
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

    el.append($$('button')
      .addClass("toggle small").attr('href', "#")
      .attr('title', this.props.title)
      .append(this.state.label)
      .on('click', this.toggleAvailableTextTypes)
    );

    // dropdown options
    var options = $$('div').addClass("options shadow border fill-white");
    _.each(textCommands, function(textCommand, commandName) {
      var button = $$('button')
          .addClass('option '+commandName)
          .attr("data-type", commandName)
          .append(textCommand.constructor.static.textTypeName)
          .on('click', this.handleClick);
      options.append(button);
    }, this);

    el.append(options);
    return el;
  };


  this.handleClick = function(e) {
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
    if (this.state.disabled) return;

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
