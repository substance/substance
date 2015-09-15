'use strict';

var SwitchTextType = require('./switch_text_type');

var MakeHeading2 = SwitchTextType.extend({
  static: {
    name: 'makeHeading2',
    textTypeName: 'Heading 2',
    nodeData: {
      type: 'heading',
      level: 2
    }
  }
});

module.exports = MakeHeading2;