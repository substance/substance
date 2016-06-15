'use strict';

var Component = require('../../ui/Component');
var TextPropertyEditor = require('../../ui/TextPropertyEditor');

function TextCellContent() {
  TextCellContent.super.apply(this, arguments);
}

TextCellContent.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-text-cell');

    var path;
    if (this.props.node) {
      path = this.props.node.getTextPath();
    } else {
      path = this.props.path;
    }

    el.append($$(TextPropertyEditor, {
      path: path,
      disabled: this.props.disabled
    }));

    return el;
  };

};

Component.extend(TextCellContent);

module.exports = TextCellContent;
