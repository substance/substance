'use strict';

var TextBlock = require('../../model/TextBlock');

function Blockquote() {
  Blockquote.super.apply(this, arguments);
}

TextBlock.extend(Blockquote);

Blockquote.type = "blockquote";

module.exports = Blockquote;
