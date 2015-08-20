'use strict';

var _ = require('../../basics/helpers');
var Component = require('../component');
var $$ = Component.$$;
var TextProperty = require('../text_property_component');

var ListComponent = Component.extend({

  render: function() {
    var tagName = this.props.node.ordered ? 'ol' : 'ul';
    var el = $$(tagName)
      .addClass("content-node")
      .attr("data-id", this.props.node.id);

    // TODO: lists can not be mixed atm. i.e., they are either ol or ul
    // the level is rendered via CSS
    _.each(this.props.node.getItems(), function(listItem) {
      el.append($$('li')
        .addClass('list-item level-'+listItem.level)
        .append($$(TextProperty, { doc: this.props.doc, path: [listItem.id, 'content'] }))
      );
    }, this);
    return el;
  }

});

module.exports = ListComponent;
