'use strict';

var platform = require('../util/platform');
var Component = require('./Component');
var Scrollbar = require('./Scrollbar');
var Overlay = require('./Overlay');
var getBoundingClientRect = require('../util/getBoundingClientRect');

/**
  Wraps content in a scroll pane.

  @class ScrollPane
  @component

  @prop {String} scrollbarType 'native' or 'substance' for a more advanced visual scrollbar. Defaults to 'native'
  @prop {String} [scrollbarPosition] 'left' or 'right' only relevant when scrollBarType: 'substance'. Defaults to 'right'
  @prop {ui/Highlights} [highlights] object that maintains highlights and can be manipulated from different sources
  @prop {ui/TOC} [toc] object that maintains table of content entries

  @example

  ```js
  $$(ScrollPane, {
    scrollbarType: 'substance', // defaults to native
    scrollbarPosition: 'left', // defaults to right
    onScroll: this.onScroll.bind(this),
    highlights: this.contentHighlights,
    toc: this.toc
  })
  ```
 */
function ScrollPane() {
  Component.apply(this, arguments);
}

ScrollPane.Prototype = function() {

  /*
    Expose scrollPane as a child context
  */
  this.getChildContext = function() {
    return {
      scrollPane: this
    };
  };

  this.didMount = function() {
    if (this.props.highlights) {
      this.props.highlights.on('highlights:updated', this.onHighlightsUpdated, this);
    }
    // HACK: Scrollbar should use DOMMutationObserver instead
    if (this.refs.scrollbar) {
      this.context.doc.on('document:changed', this.onDocumentChange, this, { priority: -1 });
    }

    this.handleActions({
      'updateOverlayHints': this._updateOverlayHints
    });
  };

  this.dispose = function() {
    if (this.props.highlights) {
      this.props.highlights.off(this);
    }
    this.context.doc.off(this);
  };

  this.render = function($$) {
    var el = $$('div')
      .addClass('sc-scroll-pane');
    var overlay;

    if (platform.isFF) {
      el.addClass('sm-firefox');
    }

    // Initialize Substance scrollbar (if enabled)
    if (this.props.scrollbarType === 'substance') {
      el.addClass('sm-substance-scrollbar');
      el.addClass('sm-scrollbar-position-'+this.props.scrollbarPosition);

      el.append(
        // TODO: is there a way to pass scrollbar highlights already
        // via props? Currently the are initialized with a delay
        $$(Scrollbar, {
          scrollPane: this
        }).ref('scrollbar')
          .attr('id', 'content-scrollbar')
      );

      // Scanline is debugging purposes, display: none by default.
      el.append(
        $$('div').ref("scanline").addClass('se-scanline')
      );
    }

    if (this.props.overlay) {
      overlay = $$(Overlay, {
        overlay: this.props.overlay
      }).ref('overlay');
    }

    el.append(
      $$('div').ref('scrollable').addClass('se-scrollable').append(
        $$('div').ref('content').addClass('se-content')
          .append(overlay)
          .append(
            this.props.children
          )
      ).on('scroll', this.onScroll)
    );
    return el;
  };

  this._updateOverlayHints = function(overlayHints) {
    // Remember overlay hints for next update
    var overlay = this.refs.overlay;
    if (overlay) {
      overlay.position(overlayHints);
    }
  };

  // HACK: Scrollbar should use DOMMutationObserver instead
  this.onDocumentChange = function() {
    this.refs.scrollbar.updatePositions();
  };

  this.onHighlightsUpdated = function(highlights) {
    this.refs.scrollbar.extendProps({
      highlights: highlights
    });
  };

  this.onScroll = function() {
    var scrollPos = this.getScrollPosition();
    var scrollable = this.refs.scrollable;
    if (this.props.onScroll) {
      this.props.onScroll(scrollPos, scrollable);
    }
    // Update TOC if provided
    if (this.props.toc) {
      this.context.toc.markActiveEntry(this);
    }
    this.emit('scroll', scrollPos, scrollable);
  };

  /**
    Returns the height of scrollPane (inner content overflows)
  */
  this.getHeight = function() {
    var scrollableEl = this.getScrollableElement();
    return scrollableEl.height;
  };

  /**
    Returns the cumulated height of a panel's content
  */
  this.getContentHeight = function() {
    var contentHeight = 0;
    var contentEl = this.refs.content.el;
    contentEl.childNodes.forEach(function(el) {
      contentHeight += el.getOuterHeight();
    });
    return contentHeight;
  };

  /**
    Get the `.se-content` element
  */
  this.getContentElement = function() {
    return this.refs.content.el;
  };

  /**
    Get the `.se-scrollable` element
  */
  this.getScrollableElement = function() {
    return this.refs.scrollable.el;
  };

  /**
    Get current scroll position (scrollTop) of `.se-scrollable` element
  */
  this.getScrollPosition = function() {
    var scrollableEl = this.getScrollableElement();
    return Math.floor(scrollableEl.getProperty('scrollTop') + 1);
  };

  /**
    Get offset relative to `.se-content`.

    @param {DOMNode} el DOM node that lives inside the
  */
  this.getPanelOffsetForElement = function(el) {
    var nativeEl = el.el;
    var contentContainerEl = this.refs.content.el.el;
    var rect = getBoundingClientRect(nativeEl, contentContainerEl);
    return rect.top;
  };

  /**
    Scroll to a given sub component.

    @param {String} componentId component id, must be present in data-id attribute
  */
  this.scrollTo = function(componentId) {
    var scrollableEl = this.getScrollableElement();
    var targetNode = scrollableEl.find('*[data-id="'+componentId+'"]');
    if (targetNode) {
      var offset = this.getPanelOffsetForElement(targetNode);
      scrollableEl.setProperty('scrollTop', offset);
    } else {
      console.warn(componentId, 'not found in scrollable container');
    }
  };
};

Component.extend(ScrollPane);

module.exports = ScrollPane;
