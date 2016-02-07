'use strict';

var Component = require('./Component');
var $$ = Component.$$;
var $ = require('../util/jquery');

/**
  A split view layout component. Takes properties for configuration and 2 children via append.

  @class SplitPane
  @component

  @prop {String} splitType either 'vertical' (default) or 'horizontal'.
  @prop {String} sizeA size of the first pane (A). '40%' or '100px' or 'inherit' are valid values.
  @prop {String} sizeB size of second pane. sizeA and sizeB can not be combined.
  
  @example
  
  ```js
  $$(SplitPane, {
    sizeA: '30%'
    splitType: 'horizontal'
  }).append(
    $$('div').append('Pane A')
    $$('div').append('Pane B')
  )
  ```
*/

function SplitPane() {
  Component.apply(this, arguments);
}

SplitPane.Prototype = function() {

  // Accepts % and px units for size property
  this.getSizedStyle = function(size) {
    if (!size || size === 'inherit') return {};
    if (this.props.splitType === 'horizontal') {
      return {'height': size};
    } else {
      return {'width': size};
    }
  };

  this.didMount = function() {
    window.document.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.document.addEventListener('mousemove', this.onMouseMove.bind(this));
  };

  this.componentWillUnmount = function() {
    window.document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    window.document.removeEventListener('mousemove', this.onMouseMove.bind(this));
  };

  this.unFocus = function() {
    if (window.document.selection) {
      window.document.selection.empty();
    } else {
      window.getSelection().removeAllRanges();
    }
  };

  this.onMouseDown = function(e) {
    this._pos = e.clientX;
    this._resizing = true;
    this.unFocus();
  };

  this.onMouseMove = function(e) {
    if (this._resizing) {
      this.unFocus();
      this._pos = e.clientX;
      // TODO: calculate pos relative to split pane not to window.
      $(this.el.children[0]).css(this.getSizedStyle(this._pos));
    }
  };

  this.onMouseUp = function() {
    this._resizing = false;
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

    var paneA = this.props.children[0];
    var paneB = this.props.children[1];

    if (this._pos) {
      paneA.addClass('se-pane sm-sized');
      paneA.css(this.getSizedStyle(this._pos));
      paneB.addClass('se-pane sm-auto-fill');
    } else {
      // Apply configured size either to pane A or B.
      if (this.props.sizeB) {
        paneB.addClass('se-pane sm-sized');
        paneB.css(this.getSizedStyle(this.props.sizeB));
        paneA.addClass('se-pane sm-auto-fill');
      } else {
        paneA.addClass('se-pane sm-sized');
        paneA.css(this.getSizedStyle(this.props.sizeA));
        paneB.addClass('se-pane sm-auto-fill');
      }      
    }

    var dividerEl = $$('div').addClass('se-split-pane-divider').ref('divider')
                        .on('mousedown', this.onMouseDown);

    el.append(
      paneA,
      dividerEl,
      paneB
    );
    return el;
  };
};

Component.extend(SplitPane);

module.exports = SplitPane;