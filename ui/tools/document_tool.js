'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var Tool = require('./tool');
var $$ = Component.$$;
var _ = require('../../basics/helpers');

/**
 * Abstract class for tools tools that interact with a document.
 * For example UndoTool or RedoTool.
 * 
 * A document context must be provided via dependency injection
 */

function DocumentTool() {
  Tool.apply(this, arguments);
  this.doc = this.context.document;

  this.doc.connect(this, {
    'document:changed': this.update
  })
}

DocumentTool.Prototype = function() {

  /**
   * Unbinds event handler before getting unmounted.
   *
   * Custom tool implementation must do a super call.
   */

  this.willUnmount = function() {
    this.doc.disconnect(this);
  };

  /**
   * Return the document provided by the current context
   * 
   * @return {Document}
   * @public
   */

  this.getDocument = function() {
    return this.doc;
  };


  this.update = function(change, info) {
    throw new Error('Must be defined by your tool implementation');
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

  this.render = function() {
    var title = this.props.title || _.capitalize(this.constructor.static.name);

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
};

OO.inherit(DocumentTool, Tool);
module.exports = DocumentTool;
