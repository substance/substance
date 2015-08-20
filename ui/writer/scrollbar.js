"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

var THUMB_MIN_HEIGHT = 7;

// A rich scrollbar implementation that supports highlights
// ----------------

function Scrollbar() {
  Component.apply(this, arguments);

  // used together with jquery
  this.onMouseUp = this.onMouseUp.bind(this);
  this.onMouseMove = this.onMouseMove.bind(this);
}

Scrollbar.Prototype = function() {

  this.getInitialState = function() {
    return {
      thumb: {top: 0, height: 20}, // just render at the top
      highlights: [] // no highlights until state derived
    };
  };

  this.render = function() {
    var el = $$('div')
      .addClass('scrollbar-component '+this.props.contextId)
      .on('mousedown', this.onMouseDown);
    el.append(
      $$('div').key("thumb")
        .addClass("thumb")
        .css({
          top: this.state.thumb.top,
          height: Math.max(this.state.thumb.height, THUMB_MIN_HEIGHT)
        })
    );
    var highlightEls = this.state.highlights.map(function(h) {
      return $$('div').key(h.id)
        .addClass('highlight')
        .css({
          top: h.top,
          height: h.height
        });
    });
    el.append(
      $$('div').key('highlights')
        .addClass('highlights')
        .append(highlightEls)
    );
    return el;
  };

  this.update = function(panelContentEl, panel) {
    // var self = this;
    this.panelContentEl = panelContentEl;
    var contentHeight = panel.getContentHeight();
    var panelHeight = panel.getPanelHeight();
    var scrollTop = panel.getScrollPosition();
    // Needed for scrollbar interaction
    this.factor = (contentHeight / panelHeight);
    var highlights = [];
    // Compute highlights

    // FIXME: This needs to be reworked...
    // why not using component.setProps() when new hihglights should be displayed?

    // this.props.highlights().forEach(function(nodeId) {
    //   var nodeEl = $(self.panelContentEl).find('*[data-id='+nodeId+']');
    //   if (!nodeEl.length) return;
    //   var top = nodeEl.position().top / self.factor;
    //   var height = nodeEl.outerHeight(true) / self.factor;
    //   // HACK: make all highlights at least 3 pxls high, and centered around the desired top pos
    //   if (height < Scrollbar.overlayMinHeight) {
    //     height = Scrollbar.overlayMinHeight;
    //     top = top - 0.5 * Scrollbar.overlayMinHeight;
    //   }
    //   var data = {
    //     id: nodeId,
    //     top: top,
    //     height: height
    //   };
    //   highlights.push(data);
    // });

    // NOTE: it is not very smart to use heavy weight rerendering
    // when we only want to change css styles.
    // this.setState({
    //   thumb: thumbProps,
    //   highlights: highlights
    // });
    // ... Substance.Component provides incremental API to do that
    this.refs.thumb.css({
      top: scrollTop / this.factor,
      height: panelHeight / this.factor
    });
    // TODO: bring back some mechanism to show highlights
  };

  this.onMouseDown = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this._mouseDown = true;
    // temporarily, we bind to events on window level
    // because could leave the this element's area while dragging
    $(window).on('mousemove', this.onMouseMove);
    $(window).on('mouseup', this.onMouseUp);

    var scrollBarOffset = this.$el.offset().top;
    var y = e.pageY - scrollBarOffset;
    var $thumbEl = this.refs.thumb.$el;
    if (e.target !== $thumbEl[0]) {
      // Jump to mousedown position
      this.offset = $thumbEl.height()/2;
      this.onMouseMove(e);
    } else {
      this.offset = y - $thumbEl.position().top;
    }
  };

  // Handle Mouse Up
  // -----------------
  //
  // Mouse lifted, nothis.panelContentEl scroll anymore

  this.onMouseUp = function() {
    this._mouseDown = false;
    $(window).off('mousemove', this.onMouseMove);
    $(window).off('mouseup', this.onMouseUp);
  };

  // Handle Scroll
  // -----------------
  //
  // Handle scroll event
  // .visible-area handle

  this.onMouseMove = function(e) {
    if (this._mouseDown) {
      var scrollBarOffset = this.$el.offset().top;
      var y = e.pageY - scrollBarOffset;
      // find offset to visible-area.top
      var scroll = (y-this.offset)*this.factor;
      this.scrollTop = $(this.panelContentEl).scrollTop(scroll);
    }
  };
};

OO.inherit(Scrollbar, Component);

Scrollbar.overlayMinHeight = 5;

module.exports = Scrollbar;
