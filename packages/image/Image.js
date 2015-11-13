var $ = require('../../util/jquery');
var DocumentNode = require('../../model/DocumentNode');

var Image = DocumentNode.extend({
  name: "image",
  properties: {
    "src": "string",
    "previewSrc": "string"
  }
});

module.exports = Image;
