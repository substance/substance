'use strict';

var SwitchTextType = require('./switch_text_type');

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