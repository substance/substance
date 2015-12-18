'use strict';

var $ = require('../util/jquery');
var Component = require('./Component');
var $$ = Component.$$;
var each = require('lodash/collection/each');

/**
  A rich scrollbar implementation that supports highlights.

  @class Scrollbar
  @component

  @prop {ui/ScrollPane} scrollPane scroll pane the scrollbar operates on
  @prop {object} highlights hightlights grouped by scope

  @example
  ```js
  $$(Scrollbar, {
    scrollPane: this,
    highlights: {
      'bib-items': ['bib-item-citation-1', 'bib-item-citation-2']
    }
  }).ref('scrollbar')
  ```

  Usually
  instantiated by {@link ScrollPane}, so you will likely not create it
  yourself. However, it's likely that you want to update the highlights
  in the scrollbar, which works like this:

  ```js
  this.scrollbar.extendState({
    highlights: {
      'figures': ['figure-1', 'figure-citation-1']
    }
  });
  ```
*/

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

    var scrollPane = this.props.scrollPane;
    var scrollableEl = scrollPane.getScrollableElement();
    $(scrollableEl).on('scroll', this.onScroll.bind(this));
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
      .addClass('sc-scrollbar')
      .on('mousedown', this.onMouseDown);
    
    if (this.props.highlights) {
      var highlightEls = [];

      each(this.props.highlights, function(highlights, scope) {
        each(highlights, function(h) {
          highlightEls.push(
            $$('div').ref(h).addClass('se-highlight sm-'+scope)
          );
        });
      });

      el.append(
        $$('div').ref('highlights')
          .addClass('se-highlights')
          .append(highlightEls)
      );
    }

    el.append($$('div').ref('thumb').addClass('se-thumb'));
    return el;
  };

  this.onScroll = function() {
    this.updatePositions();
  };

  this.updatePositions = function() {
    var scrollPane = this.props.scrollPane;
    var scrollableEl = scrollPane.getScrollableElement();
    var contentHeight = scrollPane.getContentHeight();
    var scrollPaneHeight = scrollPane.getHeight();
    var scrollTop = scrollPane.getScrollPosition();

    // Needed for scrollbar interaction
    this.factor = (contentHeight / scrollPaneHeight);

    // Update thumb
    this.refs.thumb.css({
      top: scrollTop / this.factor,
      height: scrollPaneHeight / this.factor
    });

    // If we have highlights, update them as well
    if (this.props.highlights) {
      // Compute highlights
      each(this.props.highlights,function(highlights) {
        each(highlights, function(nodeId) {
          var nodeEl = $(scrollableEl).find('*[data-id="'+nodeId+'"]');
          if (!nodeEl.length) return;
          var top = nodeEl.position().top / this.factor;
          var height = nodeEl.outerHeight(true) / this.factor;

          // Use specified minHeight for highlights
          if (height < Scrollbar.overlayMinHeight) {
            height = Scrollbar.overlayMinHeight;
          }

          var highlightEl = this.refs[nodeId];
          if (highlightEl) {
            this.refs[nodeId].css({
              top: top,
              height: height
            });
          } else {
            console.warn('no ref found for highlight', nodeId);
          }
        }.bind(this));
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
      var scrollPane = this.props.scrollPane;
      var scrollableEl = scrollPane.getScrollableElement();
      var scrollBarOffset = this.$el.offset().top;
      var y = e.pageY - scrollBarOffset;

      // find offset to visible-area.top
      var scroll = (y-this.offset)*this.factor;
      this.scrollTop = $(scrollableEl).scrollTop(scroll);
    }
  };
};

Component.extend(Scrollbar);
Scrollbar.overlayMinHeight = 2;

module.exports = Scrollbar;
