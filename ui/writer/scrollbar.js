'use strict';

var $ = require('../../basics/jquery');
var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

// A rich scrollbar implementation that supports highlights
// ----------------

function Scrollbar() {
  Component.apply(this, arguments);

  // used together with jquery
  this.onMouseUp = this.onMouseUp.bind(this);
  this.onMouseMove = this.onMouseMove.bind(this);
}

Scrollbar.Prototype = function() {

  this.didMount = function() {
    setTimeout(function() {
      this.updatePositions();
    }.bind(this));

    // Install global event handlers
    $(window).on('resize', this.rerender.bind(this));

    var panel = this.props.panel;
    var panelContentEl = panel.getPanelContentElement();
    $(panelContentEl).on('scroll', this.onScroll.bind(this));
  };

  this.dispose = function() {
    $(window).off('resize');
  };

  // TODO: This is actually a place where we could need didUpdate or
  // didRerender when we know the component has already been mounted
  this.didRender = function() {
    if (this.isMounted()) {
      this.updatePositions();
    }
  };

  this.render = function() {

    var el = $$('div')
      .addClass('scrollbar-component '+this.props.contextId)
      .on('mousedown', this.onMouseDown);
    el.append($$('div').ref("thumb").addClass("thumb"));

    if (this.props.highlights) {
      var highlightEls = this.props.highlights.map(function(h) {
        return $$('div').ref(h)
          .addClass('highlight');
      });
      el.append(
        $$('div').ref('highlights')
          .addClass('highlights')
          .append(highlightEls)
      );
    }
    return el;
  };

  this.onScroll = function() {
    this.updatePositions();
  };

  this.updatePositions = function() {
    var panel = this.props.panel;
    var panelContentEl = panel.getPanelContentElement();
    var contentHeight = panel.getContentHeight();
    var panelHeight = panel.getPanelHeight();
    var scrollTop = panel.getScrollPosition();

    // Needed for scrollbar interaction
    this.factor = (contentHeight / panelHeight);

    // Update thumb
    this.refs.thumb.css({
      top: scrollTop / this.factor,
      height: panelHeight / this.factor
    });

    // If we have highlights, update them as well
    if (this.props.highlights) {
      // Compute highlights
      this.props.highlights.forEach(function(nodeId) {
        var nodeEl = $(panelContentEl).find('*[data-id='+nodeId+']');
        if (!nodeEl.length) return;
        var top = nodeEl.position().top / this.factor;
        var height = nodeEl.outerHeight(true) / this.factor;

        // Use specified minHeight for highlights
        if (height < Scrollbar.overlayMinHeight) {
          height = Scrollbar.overlayMinHeight;
        }

        var highlight = this.refs[nodeId];
        if (highlight) {
          this.refs[nodeId].css({
            top: top,
            height: height
          });
        } else {
          console.warn('no ref found for highlight', nodeId);
        }

      }.bind(this));
    }
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
      this.offset = $thumbEl.height() / 2;
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
  // .thumb element

  this.onMouseMove = function(e) {
    if (this._mouseDown) {
      var panel = this.props.panel;
      var panelContentEl = panel.getPanelContentElement();
      var scrollBarOffset = this.$el.offset().top;
      var y = e.pageY - scrollBarOffset;

      // find offset to visible-area.top
      var scroll = (y-this.offset)*this.factor;
      this.scrollTop = $(panelContentEl).scrollTop(scroll);
    }
  };
};

OO.inherit(Scrollbar, Component);
Scrollbar.overlayMinHeight = 1;

module.exports = Scrollbar;
