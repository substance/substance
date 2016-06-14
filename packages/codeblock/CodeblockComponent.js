'use strict';

var TextBlockComponent = require('../../ui/TextBlockComponent');

function CodeblockComponent() {
  CodeblockComponent.super.apply(this, arguments);
}

CodeblockComponent.Prototype = function() {

  var _super = CodeblockComponent.super.prototype;

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    return el.addClass('sc-codeblock');
  };

};

TextBlockComponent.extend(CodeblockComponent);

module.exports = CodeblockComponent;
