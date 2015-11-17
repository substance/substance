'use strict';

var TextBlock = require('../../model/TextBlock');

var Blockquote = TextBlock.extend();

Blockquote.static.name = "blockquote";

module.exports = Blockquote;
