'use strict';

import Command from '../../ui/Command'

function SaveCommand() {
  SaveCommand.super.call(this, { name: 'save' });
}

SaveCommand.Prototype = function() {
  this.getCommandState = function(props, context) {
    var dirty = context.documentSession.isDirty();
    return {
      disabled: !dirty,
      active: false
    };
  };

  this.execute = function(props, context) {
    var documentSession = context.documentSession;
    documentSession.save();
    return {
      status: 'saving-process-started'
    };
  };
};

Command.extend(SaveCommand);

export default SaveCommand;
