'use strict';

var TextBlockComponent = require('../../ui/TextBlockComponent');

function ParagraphComponent() {
  TextBlockComponent.apply(this, arguments);
}

ParagraphComponent.Prototype = function() {

  this.getClassNames = function() {
    return 'sc-paragraph';
  };

};

TextBlockComponent.extend(ParagraphComponent);

module.exports = ParagraphComponent;
