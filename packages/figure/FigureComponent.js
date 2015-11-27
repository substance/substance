'use strict';

var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');
var $$ = Component.$$;

function FigureComponent() {
  Component.apply(this, arguments);

  this.props.node.connect(this, {
    "label:changed": this.onLabelChanged
  });
}

FigureComponent.Prototype = function() {

  this.dispose = function() {
    this.props.node.disconnect(this);
  };

  this.onLabelChanged = function() {
    this.rerender();
  };

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var contentNode = this.props.node.getContentNode();
    var ContentComponentClass = componentRegistry.get(contentNode.type);
    var el = $$('div')
      .addClass('sc-figure') // this.props.node.type
      .attr("data-id", this.props.node.id);

    el.append($$('div')
      .addClass('se-label').attr("contenteditable", false)
      .append(this.props.node.label)
    );
    el.append(
      $$(TextProperty, {
        tagName: 'div',
        path: [this.props.node.id, "title"]
      })
      .addClass('se-title')
    );
    el.append($$('div')
      .addClass('se-figure-content')
      .attr('contenteditable', false)
      .append(
        $$(ContentComponentClass, {
          doc: this.props.doc,
          node: contentNode
        })
      )
    );
    el.append($$('div')
      .addClass('se-description')
      .append(
        $$(TextProperty, {
          tagName: 'div',
          path: [this.props.node.id, "caption"]
        })
        .addClass('se-caption')
      )
    );
    return el;
  };
};

Component.extend(FigureComponent);

module.exports = FigureComponent;