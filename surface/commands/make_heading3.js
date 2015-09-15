'use strict';

var SwitchTextType = require('./switch_text_type');

var MakeHeading3 = SwitchTextType.extend({
  static: {
    name: 'makeHeading3',
    textTypeName: 'Heading 3',
    nodeData: {
      type: 'heading',
      level: 3
    }
  }
});

module.exports = MakeHeading3;