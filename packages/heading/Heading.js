'use strict';

var oo = require('../../util/oo');
var TextBlock = require('../../model/TextBlock');

function Heading() {
  Heading.super.apply(this, arguments);
}

Heading.Prototype = function() {

  getTocLevel: function() {
    return this.level;
  },

  getTocName: function() {
    return this.content;
  }

};

oo.inherit(Heading, TextBlock);

Heading.static.name = "heading";

Heading.static.defineSchema({
  "level": "number"
});

Heading.static.blockType = true;

Heading.static.tocType = true;

module.exports = Heading;
