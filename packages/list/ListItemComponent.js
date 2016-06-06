'use strict';

var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');

function ListItemComponent() {
  ListItemComponent.super.apply(this, arguments);
}

ListItemComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-list-item')
      .addClass('sm-' + node.listType)
      .attr('data-id', this.props.node.id)
      .append($$(TextProperty, {
        path: [ this.props.node.id, 'content']
      })
    );
    return el;
  };

};

Component.extend(ListItemComponent);

module.exports = ListItemComponent;
