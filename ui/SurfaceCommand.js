'use strict';

var warn = require('../util/warn');
var Command = require('./Command');

/**
  A class for commands intended to be executed on the {@link ui/Surface}
  level. See the example below to learn how to define a custom `SurfaceCommand`.

  @class
  @abstract
  @extends ui/Command

  @example

  ```js
  var SurfaceCommand = require('substance/ui/SurfaceCommand');
  var uuid = require('substance/util/uuid');
  function InsertImageCommand() {
    SurfaceCommand.apply(this, arguments);
  }
  InsertImageCommand.Prototype = function() {
    this.getCommandState = function() {
      var sel = this.getSelection();
      var newState = { disabled: true, active: false };
      if (sel && !sel.isNull() && sel.isPropertySelection()) {
        newState.disabled = false;
      }
      return newState;
    };

    this.execute = function(imageSrc) {
      var surface = this.getSurface();

      surface.transaction(function(tx, args) {
        var newImage = {
          id: uuid("image"),
          type: "image",
          src: imageSrc
        };
        // Note: returning the result which will contain an updated selection
        return surface.insertNode(tx, { selection: args.selection, node: newImage });
      });
    };

  };
  SurfaceCommand.extend(InsertImageCommand);
  InsertImageCommand.static.name = 'insertImage';
  ```
*/
var SurfaceCommand = function() {
};

SurfaceCommand.Prototype = function() {
  this.isSurfaceCommand = function() {
    return true;
  };
};

Command.extend(SurfaceCommand);

module.exports = SurfaceCommand;