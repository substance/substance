'use strict';

var BlockNodeComponent = require('../../ui/BlockNodeComponent');
var TextProperty = require('../../ui/TextPropertyComponent');

function FigureComponent() {
  FigureComponent.super.apply(this, arguments);
}

FigureComponent.Prototype = function() {

  var _super = FigureComponent.super.prototype;

  this.didMount = function() {
    _super.didMount.call(this);
    this.props.node.on("label:changed", this.onLabelChanged, this);
  };

  this.dispose = function() {
    _super.dispose.call(this);
    this.props.node.off(this);
  };

  this.render = function($$) {
    var componentRegistry = this.context.componentRegistry;
    var contentNode = this.props.node.getContentNode();
    var ContentComponentClass = componentRegistry.get(contentNode.type);

    var el = _super.render.call(this, $$)
      .addClass('sc-figure');

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

  this.onLabelChanged = function() {
    this.rerender();
  };

};

BlockNodeComponent.extend(FigureComponent);

module.exports = FigureComponent;
