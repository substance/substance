'use strict';

var BlockNode = require('../../model/BlockNode');

var Embed = BlockNode.extend({
  name: "embed",
  properties: {
    src: 'string',
    html: 'string' // Generated HTML
  }
});

module.exports = Embed;
