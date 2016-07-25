'use strict';

var TextBlock = require('../../model/TextBlock');

function Codeblock() {
  Codeblock.super.apply(this, arguments);
}

TextBlock.extend(Codeblock);

Codeblock.type = "codeblock";

module.exports = Codeblock;
