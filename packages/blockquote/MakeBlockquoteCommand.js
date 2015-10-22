'use strict';

var SwitchTextType = require('../text/SwitchTextTypeCommand');

var MakeBlockquote = SwitchTextType.extend({
  static: {
    name: 'makeBlockquote',
    textTypeName: 'Blockquote',
    nodeData: {
      type: 'blockquote'
    }
  }
});

module.exports = MakeBlockquote;