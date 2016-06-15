'use strict';

var TextBlockComponent = require('../../ui/TextBlockComponent');

function ParagraphComponent() {
  ParagraphComponent.super.apply(this, arguments);
}

ParagraphComponent.Prototype = function() {

  var _super = ParagraphComponent.super.prototype;

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    return el.addClass('sc-paragraph');
  };

};

TextBlockComponent.extend(ParagraphComponent);

module.exports = ParagraphComponent;
