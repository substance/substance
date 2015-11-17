'use strict';

var TextBlock = require('../../model/TextBlock');

var Paragraph = TextBlock.extend();

Paragraph.static.name = "paragraph";

module.exports = Paragraph;
