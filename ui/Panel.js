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

  // Get the current coordinates of the first element in the
  // set of matched elements, relative to the offset parent
  // Please be aware that it looks up until it finds a parent that has
  // position: relative|absolute set. So for now never set relative somewhere in your panel
  this.getPanelOffsetForElement = function(el) {
    var offsetTop = $(el).position().top;
    return offsetTop;
  };

  this.scrollToNode = function(nodeId) {
    // var n = this.findNodeView(nodeId);
    // TODO make this generic
    var panelContentEl = this.getScrollableContainer();

    // Node we want to scroll to
    var targetNode = $(panelContentEl).find("*[data-id="+nodeId+"]")[0];

    if (targetNode) {
      $(panelContentEl).scrollTop(this.getPanelOffsetForElement(targetNode));
    } else {
      console.warn(nodeId, 'not found in scrollable container');
    }
  };
};

oo.inherit(Panel, Component);

module.exports = Panel;
