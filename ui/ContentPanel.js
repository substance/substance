'use strict';

var $ = require('../util/jquery');
var _ = require('../util/helpers');
var oo = require('../util/oo');
var Component = require('./Component');
var $$ = Component.$$;
var Panel = require("./Panel");
var Scrollbar = require("./Scrollbar");

function ContentPanel() {
  Panel.apply(this, arguments);

  var doc = this.getDocument();
  doc.connect(this, {
    'document:changed': this.onDocumentChange,
    'toc:entry-selected': this.onTocEntrySelected,
    'highlights:updated': this.onHighlightsUpdated
  }, -1);
}

ContentPanel.Prototype = function() {

  this.dispose = function() {
    var doc = this.getDocument();
    doc.disconnect(this);
  };

  this.getDocument = function() {
    return this.context.controller.getDocument();
  };

  this.render = function() {
    var controller = this.context.controller;
    var doc = this.getDocument();

    var el = $$('div')
      .addClass("panel content-panel-component");
    el.append(
      $$(Scrollbar, {
        panel: this,
        contextId: controller.state.contextId,
        highlights: doc.getHighlights()
      }).ref("scrollbar")
        .attr('id', "content-scrollbar")
    );
    el.append(
      $$('div').ref("scanline").addClass('scanline')
    );
    el.append(
      $$('div').ref("panelContent").addClass("panel-content")
        // .css({
        //   position: 'absolute',
        //   overflow: 'auto'
        // })
        .append(
          $$('div').addClass('panel-content-inner').append(
            this.props.children
          )
        )
        .on('scroll', this.onScroll)
    );
    return el;
  };

  // this.renderContentContainer = function() {
  //   var doc = this.props.doc;
  //   var containerNode = doc.get(this.props.containerId);
  //   // var componentRegistry = this.context.componentRegistry;
  //   // var 
  //   // var ContentContainerClass = componentRegistry.get('content-container');

  //   return $$(ContentContainerClass, {
  //     doc: doc,
  //     node: containerNode,
  //   }).ref("contentContainer");
  // };

  this.onHighlightsUpdated = function(highlights) {
    var controller = this.context.controller;
    // Triggers a rerender
    this.refs.scrollbar.extendProps({
      highlights: highlights,
      contextId: controller.state.contextId
    });
  };

  // Should we do this from inside the scrollbar
  // Actually we should check if the scrollbar is actually affected
  this.onDocumentChange = function() {
    this.refs.scrollbar.updatePositions();
  };

  this.onTocEntrySelected = function(nodeId) {
    this.scrollToNode(nodeId);
  };

  this.onScroll = function() {
    this.markActiveTOCEntry();
  };

  this.markActiveTOCEntry = function() {
    var $panelContent = this.refs.panelContent.$el;

    var contentHeight = this.getContentHeight();
    var panelHeight = this.getPanelHeight();
    var scrollTop = this.getScrollPosition();

    var scrollBottom = scrollTop + panelHeight;
    var regularScanline = scrollTop;
    var smartScanline = 2 * scrollBottom - contentHeight;
    var scanline = Math.max(regularScanline, smartScanline);

    $('.scanline').css({
      top: (scanline - scrollTop)+'px'
    });
    // TODO: this should be generic
    var headings = $panelContent.find('.content-node.heading');
    if (headings.length === 0) return;
    // Use first heading as default
    var activeNode = _.first(headings).dataset.id;
    headings.each(function() {
      if (scanline >= $(this).position().top) {
        activeNode = this.dataset.id;
      }
    });

    var doc = this.getDocument();
    doc.emit('toc:entry-focused', activeNode);
  };
};

oo.inherit(ContentPanel, Panel);

module.exports = ContentPanel;
