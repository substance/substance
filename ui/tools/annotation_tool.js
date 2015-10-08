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

  this.context.toolManager.registerTool(this);
}

AnnotationTool.Prototype = function() {
  this.getInitialState = function() {
    var state = this.context.toolManager.getCommandState(this);
    return state;
  };

  this.dispose = function() {
    this.context.toolManager.unregisterTool(this);
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
