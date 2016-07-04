'use strict';

var Component = require('./Component');

function SelectionFragmentComponent() {
  SelectionFragmentComponent.super.apply(this, arguments);
}

SelectionFragmentComponent.Prototype = function() {

  this.render = function($$) {
    // TODO: we should rename se-cursor to sc-cursor
    var el = $$('span').addClass('se-selection-fragment');
    if (this.props.collaborator) {
      var collaboratorIndex = this.props.collaborator.colorIndex;
      el.addClass('sm-collaborator-'+collaboratorIndex);
    } else {
      el.addClass('sm-local-user');
    }
    el.append(this.props.children);
    return el;
  };

};

Component.extend(SelectionFragmentComponent);

module.exports = SelectionFragmentComponent;
