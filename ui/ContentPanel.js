'use strict';

var $ = require('../util/jquery');
var _ = require('../util/helpers');
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
      .addClass("sc-panel sc-content-panel");
    el.append(
      $$(Scrollbar, {
        panel: this,
        contextId: controller.state.contextId,
        highlights: doc.getHighlights()
      }).ref("scrollbar")
        .attr('id', "content-scrollbar")
    );
    el.append(
      $$('div').ref("scanline").addClass('se-scanline')
    );
    el.append(
      $$('div').ref("panelContent").addClass('se-panel-content')
        .append(
          $$('div').addClass('se-panel-content-inner').append(
            this.props.children
          )
        )
        .on('scroll', this.onScroll)
    );
    return el;
  };

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
    var doc = this.getDocument();

    var $panelContent = this.refs.panelContent.$el;
    var contentHeight = this.getContentHeight();
    var panelHeight = this.getPanelHeight();
    var scrollTop = this.getScrollPosition();

    var scrollBottom = scrollTop + panelHeight;
    var regularScanline = scrollTop;
    var smartScanline = 2 * scrollBottom - contentHeight;
    var scanline = Math.max(regularScanline, smartScanline);

    // For debugging purposes
    // To activate remove display:none for .scanline in the CSS
    $('.se-scanline').css({
      top: (scanline - scrollTop)+'px'
    });
  
    var tocNodes = doc.getTOCNodes();
    if (tocNodes.length === 0) return;

    // Use first heading as default
    var activeNode = _.first(tocNodes).id;
    tocNodes.forEach(function(tocNode) {
      var nodeEl = $panelContent.find('[data-id="'+tocNode.id+'"]')[0];
      if (!nodeEl) {
        console.warn('Not found in Content panel', tocNode.id);
        return;
      }
      var panelOffset = this.getPanelOffsetForElement(nodeEl);
      if (scanline >= panelOffset) {
        activeNode = tocNode.id;
      }
    }.bind(this));

    doc.emit('app:toc-entry:changed', activeNode);
  };
};

Panel.extend(ContentPanel);

module.exports = ContentPanel;
