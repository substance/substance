'use strict';

var SwitchTextTypeCommand = require('../text/SwitchTextTypeCommand');

var MakeHeading2Command = SwitchTextTypeCommand.extend({
  static: {
    name: 'makeHeading2',
    textTypeName: 'Heading 2',
    nodeData: {
      type: 'heading',
      level: 2
    }
  }
});

module.exports = MakeHeading2Command;