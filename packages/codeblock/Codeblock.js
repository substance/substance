'use strict';

var oo = require('../../util/oo');
var TextBlock = require('../../model/TextBlock');

function Codeblock() {
  Codeblock.super.apply(this, arguments);
}

oo.inherit(Codeblock, TextBlock);

Codeblock.static.name = "codeblock";

module.exports = Codeblock;
