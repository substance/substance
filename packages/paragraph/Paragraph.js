'use strict';

var oo = require('../../util/oo');
var TextBlock = require('../../model/TextBlock');

function Paragraph() {
  Paragraph.super.apply(this, arguments);
}

oo.inherit(Paragraph, TextBlock);

Paragraph.static.name = "paragraph";

module.exports = Paragraph;
