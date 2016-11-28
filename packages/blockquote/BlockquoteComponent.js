'use strict';

var TextBlockComponent = require('../../ui/TextBlockComponent');

function Blockquote() {
  TextBlockComponent.apply(this, arguments);
}

Blockquote.Prototype = function() {

  this.getClassNames = function() {
    return 'sc-blockquote';
  };

};

TextBlockComponent.extend(Blockquote);

module.exports = Blockquote;