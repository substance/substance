'use strict';

var TextBlock = require('../../model/TextBlock');

function Heading() {
  Heading.super.apply(this, arguments);
}

TextBlock.extend(Heading, function HeadingPrototype() {

  this.getTocLevel = function() {
    return this.level;
  };

  this.getTocName = function() {
    return this.content;
  };

});

Heading.static.name = "heading";

Heading.static.defineSchema({
  "level": "number"
});

Heading.static.tocType = true;

module.exports = Heading;
