'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;
var ListHtmlConverter = require('./ListHtmlConverter');
var ListItemComponent = require('./ListItemComponent');

var ListComponent = Component.extend({

  displayName: "ListComponent",

  initialize: function() {
    this.doc = this.props.doc;
    this.doc.getEventProxy('path').add([this.props.node.id, 'items'], this, this.onItemsChanged);
  },

  dispose: function() {
    this.doc.getEventProxy('path').remove([this.props.node.id, 'items'], this);
    this.doc = null;
  },

  render: function() {
    return ListHtmlConverter.render(this.props.node, {
      createListElement: function(list) {
        var tagName = list.ordered ? 'ol' : 'ul';
        return $$(tagName)
          .attr('data-id', list.id)
          .addClass('sc-list');
      },
      renderListItem: function(item) {
        return $$(ListItemComponent, {node: item});
      }
    });
  },

  onItemsChanged: function() {
    this.rerender();
  },

});

module.exports = ListComponent;
