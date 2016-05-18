'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

function ListItemComponent() {
  Component.apply(this, arguments);
}

ListItemComponent.Prototype = function() {

  this.initialize = function() {
    var node = this.props.node;
    node.connect(this, {'level:changed': this.rerenderList});
    node.connect(this, {'ordered:changed': this.rerenderList});
  };

  this.dispose = function() {
	  var doc = this.props.node.getDocument();
	  doc.getEventProxy('path').disconnect(this.props.node);
	  this.props.node.disconnect(this);
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
