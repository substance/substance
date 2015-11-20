'use strict';

var TextBlock = require('../../model/TextBlock');

function Paragraph() {
  Paragraph.super.apply(this, arguments);
}

TextBlock.extend(Paragraph);

Paragraph.static.name = "paragraph";

module.exports = Paragraph;
