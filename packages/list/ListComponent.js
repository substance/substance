'use strict';

var Component = require('../../ui/Component');
var ListHtmlConverter = require('./ListHTMLConverter');
var ListItemComponent = require('./ListItemComponent');

function ListComponent() {
  ListComponent.super.apply(this, arguments);
}

ListComponent.Prototype = function() {

  this.didMount = function() {
    this.doc = this.props.doc;
    this.doc.getEventProxy('path').connect(this, [this.props.node.id, 'items'], this.onItemsChanged);
  };

  this.dispose = function() {
    this.doc.getEventProxy('path').disconnect(this);
    this.doc = null;
  };

  this.render = function($$) {
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
  };

  this.onItemsChanged = function() {
    this.rerender();
  };

};

Component.extend(ListComponent);

module.exports = ListComponent;
