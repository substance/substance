var DocumentNode = require('../../model/DocumentNode');

var oo = require('../../util/oo');

function Image() {
  Image.super.apply(this, arguments);
}

oo.inherit(Image, DocumentNode);

Image.static.name = "image";

Image.static.defineSchema({
  "src": { type: "string", default: "http://" },
  "previewSrc": { type: "string", optional: true }
});

module.exports = Image;
