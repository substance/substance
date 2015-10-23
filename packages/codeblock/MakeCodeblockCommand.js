'use strict';

var SwitchTextType = require('../text/SwitchTextTypeCommand');

var MakeCodeblock = SwitchTextType.extend({
  static: {
    name: 'makeCodeblock',
    textTypeName: 'Codeblock',
    nodeData: {
      type: 'codeblock'
    }
  }
});

module.exports = MakeCodeblock;