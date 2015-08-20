'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var TextProperty = require('../text_property_component');

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {

  this.render = function() {
    return $$('div')
      .addClass("content-node heading level-"+this.props.node.level)
      .attr("data-id", this.props.node.id)
      .append($$(TextProperty)
        .addProps({
          doc: this.props.doc,
          path: [ this.props.node.id, "content"]
        })
      );
  };
};

OO.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;
