'use strict';

var Tool = require('../../ui/Tool');

function InsertImageTool() {
  InsertImageTool.super.apply(this, arguments);
}

InsertImageTool.Prototype = function() {

  var _super = InsertImageTool.super.prototype;

  this.getClassNames = function() {
    return 'sc-insert-image-tool';
  };

  this.renderButton = function($$) {
    var button = _super.renderButton.apply(this, arguments);
    var input = $$('input').attr('type', 'file').ref('input')
      .on('change', this.onFileSelect);
    return [button, input];
  };

  this.onClick = function() {
    this.refs.input.click();
  };

  this.onFileSelect = function(e) {
    // Pick the first file
    var file = e.currentTarget.files[0];
    this.performAction({
      file: file
    });
  };

};

Tool.extend(InsertImageTool);

InsertImageTool.static.name = 'insert-image';

module.exports = InsertImageTool;
