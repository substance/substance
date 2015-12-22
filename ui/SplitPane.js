'use strict';

var Component = require('./Component');
var $$ = Component.$$;

function SplitPane() {
  Component.apply(this, arguments);
}

SplitPane.Prototype = function() {

  // Accepts % and px units for size property
  this.getReferenceStyle = function() {
    var size = this.props.size || '40%';
    if (this.props.splitType === 'horizontal') {
      return {'height': size};
    } else {
      return {'width': size};
    }
  };

  this.render = function() {
    if (this.props.children.length !== 2) {
      throw new Error('SplitPane only works with exactly two child elements');
    }

    var el = $$('div').addClass('sc-split-pane');
    if (this.props.splitType === 'horizontal') {
      el.addClass('sm-horizontal');
    } else {
      el.addClass('sm-vertical');
    }

    var pane1 = this.props.children[0];
    var pane2 = this.props.children[1];

    if (this.props.reverseSizing) {
      // Second pane gets the fixed size
      pane2.addClass('se-pane sm-sized');
      pane2.css(this.getReferenceStyle());
      pane1.addClass('se-pane sm-stretched');
    } else {
      pane1.addClass('se-pane sm-sized');
      pane1.css(this.getReferenceStyle());
      pane2.addClass('se-pane sm-stretched');
    }

    // We monkey patch
    el.append(
      pane1,
      pane2
    );
    return el;
  };
};

Component.extend(SplitPane);

module.exports = SplitPane;