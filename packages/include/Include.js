'use strict';

var DocumentNode = require('../../model/DocumentNode');

var Include = DocumentNode.extend({
  name: "include",
  displayName: "Include",
  properties: {
    "nodeType": "string",
    "nodeId": "id"
  },

  getIncludedNode: function() {
    return this.getDocument().get(this.nodeId);
  },
});

Include.static.components = [];

Include.static.blockType = true;

module.exports = Include;