'use strict';

var oo = require('../util/oo');
var Tool = require('./Tool');

/*
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

  /*
   * Get document instance
   *
   * @method getDocument
   * @return {module:document.Document} The document instance owned by the controller
   * @memberof module:ui/tools.ControllerTool.prototype
   */
  this.getDocument = function() {
    return this.context.controller.getDocument();
  };

  this.performAction = function() {
    var ctrl = this.getController();
    ctrl.executeCommand(this.constructor.static.command);
  };

};

oo.inherit(ControllerTool, Tool);

module.exports = ControllerTool;
