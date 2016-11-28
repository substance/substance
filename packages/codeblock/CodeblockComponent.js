'use strict';

var TextBlockComponent = require('../../ui/TextBlockComponent');

function Codeblock() {
  TextBlockComponent.apply(this, arguments);
}

Codeblock.Prototype = function() {

  this.getClassNames = function() {
    return "sc-codeblock";
  };

};

TextBlockComponent.extend(Codeblock);

module.exports = Codeblock;