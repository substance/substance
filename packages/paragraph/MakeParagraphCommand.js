'use strict';

var SwitchTextType = require('../text/SwitchTextTypeCommand');

var ParagraphCommand = SwitchTextType.extend({
  static: {
    name: 'paragraph',
    textTypeName: 'Paragraph',
    nodeData: {
      type: 'paragraph'
    }
  }
});

module.exports = ParagraphCommand;