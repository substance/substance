'use strict';

var SwitchTextType = require('./switch_text_type');

var Paragraph = SwitchTextType.extend({
  static: {
    name: 'makeParagraph',
    textTypeName: 'Paragraph',
    nodeData: {
      type: 'paragraph'
    }    
  }
});

module.exports = Paragraph;