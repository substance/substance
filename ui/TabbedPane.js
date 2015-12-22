'use strict';

var Component = require('./Component');
var each = require('lodash/collection/each');
var $$ = Component.$$;

function TabbedPane() {
  Component.apply(this, arguments);
}

TabbedPane.Prototype = function() {
  this.render = function() {
    var el = $$('div').addClass('sc-tabbed-pane');

    // Tabs
    var tabsEl = $$('div').addClass('se-tabs');
    each(this.props.tabs, function(tab) {
      var tabEl = $$('a')
        .addClass("se-tab")
        .attr({
          href: "#",
          "data-id": tab.id,
        })
        .on('click', this.onTabClicked);
      if (tab.id === this.props.activeTab) {
        tabEl.addClass("sm-active");
      }
      tabEl.append(
        $$('span').addClass('label').append(tab.name)
      );
      tabsEl.append(tabEl);
    }, this);
    
    el.append(tabsEl);

    // Active content
    el.append(
      $$('div').addClass('se-tab-content').ref('tabContent').append(
        this.props.children
      )
    );
    return el;
  };

  this.onTabClicked = function(e) {
    e.preventDefault();
    var tabId = e.currentTarget.dataset.id;
    this.send('switchTab', tabId);
  };
};

Component.extend(TabbedPane);

module.exports = TabbedPane;