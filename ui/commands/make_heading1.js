'use strict';

var SwitchTextType = require('./switch_text_type');

var MakeHeading1 = SwitchTextType.extend({
  static: {
    name: 'makeHeading1',
    textTypeName: 'Heading 1',
    nodeData: {
      type: 'heading',
      level: 1
    }
  }
});

module.exports = MakeHeading1;
