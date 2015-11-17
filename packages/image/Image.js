var DocumentNode = require('../../model/DocumentNode');

var Image = DocumentNode.extend();

Image.static.name = "image";

Image.static.schema = {
  "src": { type: "string" },
  "previewSrc": { type: "string" }
};

module.exports = Image;
