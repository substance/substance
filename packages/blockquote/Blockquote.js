'use strict';

var oo = require('../../util/oo');
var TextBlock = require('../../model/TextBlock');

function Blockquote() {
  Blockquote.super.apply(thism arguments);
}

oo.inherit(Blockquote, TextBlock);

Blockquote.static.name = "blockquote";

module.exports = Blockquote;
