'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var SurfaceTool = require('./surface_tool');
var _ = require('../../basics/helpers');

/**
 * Abstract class for annotation tools like StrongTool, EmphasisTool, LinkTool
 * 
 * Implements the SurfaceTool API.
 */

function AnnotationTool() {
  SurfaceTool.apply(this, arguments);
}

AnnotationTool.Prototype = function() {


  // When update is called we can be sure the Surface is active
  this.update = function(sel, surface) {


    var command = this.getCommand();
    if (!command) {
      console.log('Command', this.constructor.static.command, 'not registered on Surface');
      return this.setDisabled();
    }
    var annos = command.getAnnotationsForSelection();

    var newState = {
      disabled: false,
      active: false,
      mode: null
    };

    // We can skip all checking if a disabled condition is met
    // E.g. we don't allow toggling of property annotations when current
    // selection is a container selection
    if (command.isDisabled(annos, sel)) {
      newState.disabled = true;
    } else if (command.canCreate(annos, sel)) {
      newState.mode = "create";
    } else if (command.canFuse(annos, sel)) {
      newState.mode = "fusion";
    } else if (command.canTruncate(annos, sel)) {
      newState.active = true;
      newState.mode = "truncate";
    } else if (command.canExpand(annos, sel)) {
      newState.mode = "expand";
    } else if (command.canEdit(annos, sel)) {
      newState.mode = "edit";
      newState.annotationId = annos[0].id;
      newState.active = true;
    } else if (command.canDelete(annos, sel)) {
      newState.active = true;
      newState.mode = "delete";
    } else {
      newState.disabled = true;
    }

    this.setState(newState);
  };


  // UI-specific
  // --------------------------

  this.render = function() {
    var title = this.props.title || _.capitalize(this.getName());

    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$("button")
      .attr('title', title)
      .addClass('button tool')
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
};

OO.inherit(AnnotationTool, SurfaceTool);

module.exports = AnnotationTool;
