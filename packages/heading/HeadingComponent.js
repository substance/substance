'use strict';

var TextBlockComponent = require('../../ui/TextBlockComponent');

function HeadingComponent() {
  TextBlockComponent.apply(this, arguments);
}

HeadingComponent.Prototype = function() {

  this.getClassNames = function() {
    return "sc-heading sm-level-"+this.props.node.level
  }

};

TextBlockComponent.extend(HeadingComponent);

module.exports = HeadingComponent;
