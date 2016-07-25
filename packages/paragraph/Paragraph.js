'use strict';

var TextBlock = require('../../model/TextBlock');

function Paragraph() {
  Paragraph.super.apply(this, arguments);
}

TextBlock.extend(Paragraph);

Paragraph.type = "paragraph";

module.exports = Paragraph;
