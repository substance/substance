'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var SurfaceTool = require('./surface_tool');
var _ = require('../../basics/helpers');

/**
 * Abstract class for annotation tools like StrongTool, EmphasisTool
 * 
 * Implements the SurfaceTool API.
 */

function AnnotationTool() {
  SurfaceTool.apply(this, arguments);
}

AnnotationTool.Prototype = function() {

  this.getToolName = function() {
    var toolName = this.constructor.static.name;
    if (toolName) {
      return toolName;
    } else {
      throw new Error('Contract: AnnotationTool.static.name should have a value to describe the tool');
    }
  };

  this.getCommand = function() {
    var commandName = this.constructor.static.command;
    if (commandName) {
      return this.getSurface().getCommand(commandName);
    } else {
      throw new Error('Contract: AnnotationTool.static.command should be associated to a supported command.');
    }
  };

  // When update is called we can be sure the Surface is active
  this.update = function(sel, surface) {
    if ((!surface.isEnabled()) || sel.isNull() ) {
      return this.setDisabled();
    }
    var command = this.getCommand();
    if (!command) {
      console.log('Command', this.constructor.static.command, 'not registered on Surface');
      return this.setDisabled();
    }
    var annos = command.getAnnotationsForSelection();

    var newState = {
      disabled: false,
      active: false,
      mode: null,
      annos: annos
    };

    // We can skip all checking if a disabled condition is met
    // E.g. we don't allow toggling of property annotations when current
    // selection is a container selection
    if (command.isDisabled(annos, sel)) {
      this.setDisabled();
    } else if (command.canCreate(annos, sel)) {
      newState.mode = "create";
    } else if (command.canFuse(annos, sel)) {
      newState.mode = "fusion";
    } else if (command.canTruncate(annos, sel)) {
      newState.active = true;
      newState.mode = "truncate";
    } else if (command.canDelete(annos, sel)) {
      newState.active = true;
      newState.mode = "delete";
    } else if (command.canExpand(annos, sel)) {
      newState.mode = "expand";
    }

    // Verifies if the detected mode has been disabled by the concrete implementation
    if (!newState.mode) {
      return this.setDisabled();
    } else {
      this.setState(newState);
    }
  };

  // This should go into some command abstraction so we can reuse this with keybindings
  // Command ToggleAnnotation
  this.performAction = function() {
    var command = this.getCommand();
    command.execute();
  };

  // UI-specific
  // --------------------------

  this.render = function() {
    var title = this.props.title || _.capitalize(this.getToolName());

    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$("button")
      .attr('title', title)
      .addClass('button tool')
      .on('mousedown', this.onMouseDown)
      .on('click', this.onClick);

    if (this.state.disabled) {
      el.addClass('disabled');
    }
    if (this.state.active) {
      el.addClass('active');
    }
    if (this.state.mode) {
      el.addClass(this.state.mode);
    }

    el.append(this.props.children);
    return el;
  };

  this.onClick = function(e) {
    e.preventDefault();
  };

  this.onMouseDown = function(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.performAction();
  };
};

OO.inherit(AnnotationTool, SurfaceTool);

module.exports = AnnotationTool;
