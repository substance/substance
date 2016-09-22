'use strict';

import Component from '../../ui/Component'

function Input() {
  Component.apply(this, arguments);
}

Input.Prototype = function() {

  this._onChange = function() {
    var documentSession = this.context.documentSession;
    var path = this.props.path;
    var newVal = this.el.val();

    documentSession.transaction(function(tx) {
      tx.set(path, newVal);
    });
  };

  this.render = function($$) {
    var val;

    if (this.props.path) {
      var documentSession = this.context.documentSession;
      var doc = documentSession.getDocument();
      val = doc.get(this.props.path)
      console.log('val', val)
    } else {
      val = this.props.value
    }

    var el = $$('input').attr({
      value: val,
      type: this.props.type,
      placeholder: this.props.placeholder
    })
    .addClass('sc-input');

    if (this.props.path) {
      el.on('change', this._onChange)
    }

    if (this.props.centered) {
      el.addClass('sm-centered');
    }

    return el;
  };
};

Component.extend(Input);
export default Input;