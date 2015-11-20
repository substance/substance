'use strict';

var TextBlock = require('../../model/TextBlock');

function Codeblock() {
  Codeblock.super.apply(this, arguments);
}

TextBlock.extend(Codeblock);

Codeblock.static.name = "codeblock";

module.exports = Codeblock;
