'use strict';

var BlockNodeComponent = require('./BlockNodeComponent');
var TextProperty = require('./TextPropertyComponent');

function TextBlockComponent() {
  TextBlockComponent.super.apply(this, arguments);
}

TextBlockComponent.Prototype = function() {

  var _super = TextBlockComponent.super.prototype;

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    el.append($$(TextProperty, {
      path: [ this.props.node.id, "content"]
    }));
    return el;
  };

};

BlockNodeComponent.extend(TextBlockComponent);

module.exports = TextBlockComponent;
