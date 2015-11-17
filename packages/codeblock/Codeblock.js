'use strict';

var TextBlock = require('../../model/TextBlock');

function Codeblock() {
  Codeblock.super.apply(thism arguments);
}

oo.inherit(Codeblock, TextBlock);

Codeblock.static.name = "codeblock";

module.exports = Codeblock;
