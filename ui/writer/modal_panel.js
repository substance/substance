'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
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

  this.willUnmount = function() {
    this.$el.off('click');
  };

  this.preventBubbling = function(e) {
    e.stopPropagation();
    e.preventDefault();
  };
};

OO.inherit(ModalPanel, Component);

module.exports = ModalPanel;
