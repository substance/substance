'use strict';

var TextBlock = require('../../model/TextBlock');

function Heading() {
  Heading.super.apply(this, arguments);
}

TextBlock.extend(Heading);

Heading.static.name = "heading";

Heading.static.defineSchema({
  "level": { type: "number", default: 1 }
});

module.exports = Heading;
