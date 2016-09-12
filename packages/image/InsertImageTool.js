'use strict';

import Tool from '../../ui/Tool'

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
    var files = e.currentTarget.files;
    this.performAction({
      files: Array.prototype.slice.call(files)
    });
  };

};

Tool.extend(InsertImageTool);

export default InsertImageTool;
