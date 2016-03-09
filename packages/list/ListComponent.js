'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;
var ListHtmlConverter = require('./ListHTMLConverter');
var ListItemComponent = require('./ListItemComponent');

var ListComponent = Component.extend({

  displayName: "ListComponent",

  initialize: function() {
    this.doc = this.props.doc;
    this.doc.getEventProxy('path').connect(this, [this.props.node.id, 'items'], this.onItemsChanged);
    this.doc.getEventProxy('path').connect(this, [this.props.node.id, 'ordered'], this.onOrderChanged);
  },

  dispose: function() {
    this.doc.getEventProxy('path').disconnect(this);
    this.doc = null;
  },

  render: function() {
    var elem = ListHtmlConverter.render(this.props.node, {
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
    return $$('div').append(elem);
  },

  onItemsChanged: function() {
    this.rerender();
  },

  onOrderChanged: function() {
    this.rerender();
  }

});

module.exports = ListComponent;
