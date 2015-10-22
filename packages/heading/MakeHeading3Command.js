'use strict';

var SwitchTextTypeCommand = require('../text/SwitchTextTypeCommand');

var MakeHeading3Command = SwitchTextTypeCommand.extend({
  static: {
    name: 'makeHeading3',
    textTypeName: 'Heading 3',
    nodeData: {
      type: 'heading',
      level: 3
    }
  }
});

module.exports = MakeHeading3Command;