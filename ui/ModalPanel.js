'use strict';

var Component = require('./Component');
var $$ = Component.$$;

function ModalPanel() {
  Component.apply(this,arguments);
}

ModalPanel.Prototype = function() {

  this.render = function() {
    var el = $$('div').addClass('modal');
    var modalSize = this.props.panelElement.type.modalSize;
    if (modalSize) {
      el.addClass(modalSize);
    }
    el.append($$('div')
      .addClass('modal-body')
      .append(this.props.panelElement)
      .on('click', this.preventBubbling)
    );
    return el;
  };

  this.preventBubbling = function(e) {
    e.stopPropagation();
    e.preventDefault();
  };
};

Component.extend(ModalPanel);

module.exports = ModalPanel;
