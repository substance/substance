'use strict';

import Component from '../../ui/Component'
import each from 'lodash/each'
import DefaultDOMElement from '../../ui/DefaultDOMElement'

/**
  A rich scrollbar implementation that supports highlights.   Usually
  instantiated by {@link ScrollPane}, so you will likely not create it
  yourself.

  @class Scrollbar
  @component
  @private

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
*/

function Scrollbar() {
  Scrollbar.super.apply(this, arguments);
}

Scrollbar.Prototype = function() {

  this.didMount = function() {
    // do a full rerender when window gets resized
    DefaultDOMElement.getBrowserWindow().on('resize', this.onResize, this);
    // update the scroll handler on scroll
    this.props.scrollPane.on('scroll', this.onScroll, this);
    // TODO: why is this necessary here?
    setTimeout(function() {
      this.updatePositions();
    }.bind(this));
  };

  this.dispose = function() {
    DefaultDOMElement.getBrowserWindow().off(this);
    this.props.scrollPane.off(this);
  };

  this.didUpdate = function() {
    this.updatePositions();
  };

  this.render = function($$) {
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
          var nodeEl = scrollableEl.find('*[data-id="'+nodeId+'"]');
          if (!nodeEl) return;
          var top = nodeEl.getPosition().top / this.factor;
          var height = nodeEl.getOuterHeight(true) / this.factor;

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

  this.getScrollableElement = function() {
    return this.props.scrollPane.getScrollableElement();
  };

  this.onResize = function() {
    this.rerender();
  };

  this.onScroll = function() {
    this.updatePositions();
  };

  this.onMouseDown = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this._mouseDown = true;

    // temporarily, we bind to events on window level
    // because could leave the this element's area while dragging
    var _window = DefaultDOMElement.getBrowserWindow();
    _window.on('mousemove', this.onMouseMove, this);
    _window.on('mouseup', this.onMouseUp, this);

    var scrollBarOffset = this.el.getOffset().top;
    var y = e.pageY - scrollBarOffset;
    var thumbEl = this.refs.thumb.el;
    if (e.target !== thumbEl.getNativeElement()) {
      // Jump to mousedown position
      this.offset = thumbEl.height / 2;
      this.onMouseMove(e);
    } else {
      this.offset = y - thumbEl.getPosition().top;
    }
  };

  // Handle Mouse Up
  this.onMouseUp = function() {
    this._mouseDown = false;
    var _window = DefaultDOMElement.getBrowserWindow();
    _window.off('mousemove', this.onMouseMove, this);
    _window.off('mouseup', this.onMouseUp, this);
  };

  this.onMouseMove = function(e) {
    if (this._mouseDown) {
      var scrollPane = this.props.scrollPane;
      var scrollableEl = scrollPane.getScrollableElement();
      var scrollBarOffset = this.el.getOffset().top;
      var y = e.pageY - scrollBarOffset;

      // find offset to visible-area.top
      var scroll = (y-this.offset)*this.factor;
      scrollableEl.setProperty('scrollTop', scroll);
    }
  };
};

Component.extend(Scrollbar);
Scrollbar.overlayMinHeight = 2;

export default Scrollbar;
