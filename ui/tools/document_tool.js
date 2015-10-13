'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var Tool = require('./tool');
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

function DocumentTool() {
  Tool.apply(this, arguments);

  var doc = this.getDocument();
  doc.connect(this, {
    'document:changed': this.update
  });
}

DocumentTool.Prototype = function() {

  /**
   * Dispose tool when component life ends. If you need to implement dispose
   * in your custom tool class, don't forget the super call.
   * 
   * @method dispose
   * @memberof module:ui/tools.DocumentTool.prototype
   */
  this.dispose = function() {
    var doc = this.getDocument();
    doc.disconnect(this);
  };

  /**
   * Get document instance
   *
   * @method getDocument
   * @return {module:document.Document} The document instance owned by the controller
   * @memberof module:ui/tools.DocumentTool.prototype
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

OO.inherit(DocumentTool, Tool);

module.exports = DocumentTool;
