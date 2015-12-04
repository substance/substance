'use strict';

var $ = require('../util/jquery');
var Component = require('./Component');
var $$ = Component.$$;

function ScrollPane() {
  Component.apply(this, arguments);
}

ScrollPane.Prototype = function() {
  this.render = function() {
    var el = $$('div')
      .addClass('sc-scroll-pane');

    el.append(
      $$('div').ref('content').addClass('se-content').append(
        this.props.children
      )
    );
    return el;
  };

  // Returns the cumulated height of a panel's content
  this.getContentHeight = function() {
    var contentHeight = 0;
    var el = this.el;

    $(el).children().each(function() {
     contentHeight += $(this).outerHeight();
    });
    return contentHeight;
  };

  this.getPanelOffsetForElement = function(el) {
    // initial offset
    var offset = $(el).position().top;

    // Now look at the parents
    function addParentOffset(el) {
      var parentEl = el.parentNode;

      // Reached the content wrapper element or the parent el. We are done.
      if ($(el).hasClass('se-content') || !parentEl) return;

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
    var el = this.el;
    // Node we want to scroll to
    var targetNode = $(el).find('*[data-id="'+nodeId+'"]')[0];
    if (targetNode) {
      var offset = this.getPanelOffsetForElement(targetNode);
      $(el).scrollTop(offset);
    } else {
      console.warn(nodeId, 'not found in scrollable container');
    }
  };
};

Component.extend(ScrollPane);

module.exports = ScrollPane;
