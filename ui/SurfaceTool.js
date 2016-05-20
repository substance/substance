'use strict';

var Tool = require('./Tool');

// TODO: we no longer need Surface tool as a specialization

/**
  Abstract class for tools that interact with the selection of active surface.
  Needs to be instantiated inside a {@link ui/Controller} context.

  @class
  @component
  @abstract
  @extends ui/Tool

  @example

  ```js
  var SurfaceTool = require('substance/ui/SurfaceTool');
  function InsertImageTool() {
    InsertImageTool.super.apply(this, arguments);
  }
  SurfaceTool.extend(InsertImageTool);
  InsertImageTool.static.name = 'insertImage';
  ```
*/
function SurfaceTool() {
  SurfaceTool.super.apply(this, arguments);
}

SurfaceTool.Prototype = function() {
  this._isSurfaceTool = true;
};

Tool.extend(SurfaceTool);
module.exports = SurfaceTool;
