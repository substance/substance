var Tool = require('../../ui/Tool');

function ImageTool() {
  ImageTool.super.apply(this, arguments);
}

Tool.extend(ImageTool);

ImageTool.static.name = 'insert-image';

module.exports = ImageTool;