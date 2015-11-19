'use strict';

var DocumentNode = require('../../model/DocumentNode');

function Image() {
  Image.super.apply(this, arguments);
}

DocumentNode.extend(Image);

Image.static.name = "image";

Image.static.defineSchema({
  "src": { type: "string", default: "http://" },
  "previewSrc": { type: "string", optional: true }
});

module.exports = Image;
