'use strict';

var SwitchTextTypeCommand = require('../text/SwitchTextTypeCommand');

var MakeHeading1Command = SwitchTextTypeCommand.extend({
  static: {
    name: 'makeHeading1',
    textTypeName: 'Heading 1',
    nodeData: {
      type: 'heading',
      level: 1
    }
  }
});

module.exports = MakeHeading1Command;
