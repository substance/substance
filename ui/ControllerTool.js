'use strict';

var OO = require('../basics/oo');
var Component = require('./Component');
var Tool = require('./Tool');
var $$ = Component.$$;

/**
 * Abstract class for tools tools that interact with a document. E.g. UndoTool or RedoTool.
 * 
 * Requires a Controller context.
 *
 * @class
 * @extends module:ui/tools.Tool
 * @memberof module:ui/tools
 */

function ControllerTool() {
  Tool.apply(this, arguments);
  if (!this.context.controller) throw new Error('No controller context found.');
}

ControllerTool.Prototype = function() {

  /**
   * Get document instance
   *
   * @method getDocument
   * @return {module:document.Document} The document instance owned by the controller
   * @memberof module:ui/tools.ControllerTool.prototype
   */
  this.getDocument = function() {
    return this.context.controller.getDocument();
  };


  this.onClick = function(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.performAction();
  };

  this.render = function() {
    var title = this.props.title || this.i18n.t(this.constructor.static.name);

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

OO.inherit(ControllerTool, Tool);

module.exports = ControllerTool;
