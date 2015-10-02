'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var TextProperty = require('../text_property_component');
var $$ = Component.$$;

function FigureComponent() {
  Component.apply(this, arguments);
}

FigureComponent.Prototype = function() {

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var contentNode = this.props.node.getContentNode();

    var ctrl = this.context.controller;    
    var ContentComponentClass = ctrl.getComponent(contentNode.type);

    var el = $$('div')
      .addClass("content-node figure clearfix "+this.props.node.type)
      .attr("data-id", this.props.node.id);

    el.append($$('div')
      .addClass('label').attr("contentEditable", false)
      .append(this.props.node.label)
    );
    el.append($$(TextProperty)
      .addClass('title')
      .addProps({
        tagName: 'div',
        doc: this.props.doc,
        path: [this.props.node.id, "title"]
      })
    );
    el.append($$('div')
      .addClass('figure-content')
      .append($$(ContentComponentClass)
        .addProps({
          doc: this.props.doc,
          node: contentNode
        })
      )
    );
    el.append($$('div')
      .addClass('description small')
      .append($$(TextProperty)
        .addClass('caption')
        .addProps({
          tagName: 'div',
          doc: this.props.doc,
          path: [this.props.node.id, "caption"]
        })
      )
    );
    return el;
  };
};

OO.inherit(FigureComponent, Component);

module.exports = FigureComponent;
