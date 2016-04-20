'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

function ListItemComponent() {
  Component.apply(this, arguments);
}

ListItemComponent.Prototype = function() {

  this.initialize = function() {
    this.doc = this.props.node.getDocument();
    this.doc.getEventProxy('path').connect(this, [this.props.node.id, 'level'], this.rerenderList);
    this.doc.getEventProxy('path').connect(this, [this.props.node.id, 'ordered'], this.rerenderList);
  };

  this.render = function() {
    var item = this.props.node;
    var doc = item.getDocument();
    var el = $$('li').addClass('sc-li')
      .attr('data-id', item.id)
      .append($$(TextProperty, { doc: doc, path: [item.id, 'content']}));
    return el;
  };

  this.rerenderList = function() {
    this.send('rerenderList');
  };
};

Component.extend(ListItemComponent);

module.exports = ListItemComponent;
