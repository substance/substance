'use strict';

var SwitchTextType = require('./switch_text_type');

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