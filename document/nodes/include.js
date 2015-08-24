var DocumentNode = require('../node');

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

Include.static.components = ['nodeId'];

Include.static.blockType = true;

Include.static.matchElement = function($el) {
  return $el.is('include');
};

Include.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'include');
  var inc = {
    id: id,
    nodeId: $el.attr('data-rid'),
    nodeType: $el.attr('data-rtype'),
  };
  return inc;
};

Include.static.toHtml = function(inc, converter) {
  var id = inc.id;
  var $el = $('<include>')
    .attr('id', id)
    .attr('data-rtype', inc.nodeType)
    .attr('data-rid', inc.nodeId);
  return $el;
};

module.exports = Include;