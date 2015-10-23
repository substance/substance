'use strict';

var OO = require('../util/oo');
var Component = require('./Component');
var $$ = Component.$$;
var SurfaceTool = require('./SurfaceTool');
var _ = require('../util/helpers');

/**
 * Abstract class for annotation tools like StrongTool, EmphasisTool, LinkTool.
 *
 * @class
 * @extends module:ui/tools.SurfaceTool
 * @memberof module:ui/tools
 */

function AnnotationTool() {
  SurfaceTool.apply(this, arguments);
}

AnnotationTool.Prototype = function() {

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
