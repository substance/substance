'use strict';

var TextBlockComponent = require('../../ui/TextBlockComponent');

function HeadingComponent() {
  HeadingComponent.super.apply(this, arguments);
}

HeadingComponent.Prototype = function() {

  var _super = HeadingComponent.super.prototype;

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    return el.addClass("sc-heading sm-level-"+this.props.node.level);
  };

};

TextBlockComponent.extend(HeadingComponent);

module.exports = HeadingComponent;
