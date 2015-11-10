'use strict';

var $ = require('../util/jquery');
var oo = require('../util/oo');
var Component = require('./Component');
var $$ = Component.$$;

function Panel() {
  Component.apply(this, arguments);
}

Panel.Prototype = function() {

  // This method must be overriden with your panel implementation
  this.render = function() {
    return $$("div")
      .addClass("panel")
      .append(
        $$('div')
          .addClass('panel-content')
          .append('YOUR_PANEL_CONTENT')
      );
  };

  this.getController = function() {
    return this.context.controller;
  };

  this.getDocument = function() {
    return this.props.doc;
  };

  this.getPanelContentElement = function() {
    return this.refs.panelContent.$el[0];
  };

  this.getScrollableContainer = function() {
    return this.refs.panelContent.$el[0];
  };

  // Returns the cumulated height of a panel's content
  this.getContentHeight = function() {
    // initialized lazily as this element is not accessible earlier (e.g. during construction)
    // get the new dimensions
    // TODO: better use outerheight for contentheight determination?
    var contentHeight = 0;
    var panelContentEl = this.getPanelContentElement();

    $(panelContentEl).children().each(function() {
     contentHeight += $(this).outerHeight();
    });
    return contentHeight;
  };

  // Returns the height of panel (inner content overflows)
  this.getPanelHeight = function() {
    var panelContentEl = this.getPanelContentElement();
    return $(panelContentEl).height();
  };

  this.getScrollPosition = function() {
    var panelContentEl = this.getPanelContentElement();
    return $(panelContentEl).scrollTop();
  };

  this.getPanelOffsetForElement = function(el) {
    // initial offset
    var offset = $(el).position().top;

    // Now look at the parents
    function addParentOffset(el) {
      var parentEl = el.parentNode;

      // Reached the panel or the document body. We are done.
      if ($(el).hasClass('panel-content-inner') || !parentEl) return;

      // Found positioned element (calculate offset!)
      if ($(el).css('position') === 'absolute' || $(el).css('position') === 'relative') {
        offset += $(el).position().top;
      }
      addParentOffset(parentEl);
    }

    addParentOffset(el.parentNode);
    return offset;
  };

  this.scrollToNode = function(nodeId) {
    // var n = this.findNodeView(nodeId);
    // TODO make this generic
    var panelContentEl = this.getScrollableContainer();

    // Node we want to scroll to
    var targetNode = $(panelContentEl).find('*[data-id="'+nodeId+'"]')[0];

    if (targetNode) {
      $(panelContentEl).scrollTop(this.getPanelOffsetForElement(targetNode));
    } else {
      console.warn(nodeId, 'not found in scrollable container');
    }
  };
};

oo.inherit(Panel, Component);

module.exports = Panel;
