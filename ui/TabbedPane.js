'use strict';

var Component = require('./Component');
var each = require('lodash/each');

/**
  A tabbed pane layout component. The actual content is specified via append.

  @class TabbedPane
  @component

  @prop {Object[]} tabs an array of objects with id and name properties
  @prop {String} activeTab id of currently active tab

  @example

  ```js
  $$(TabbedPane, {
    tabs: [
      {id: 'tabA', 'A'},
      {id: 'tabB', 'B'},
    ],
    activeTab: 'tabA'
  }).ref('tabbedPane').append(
    tabAContent
  )
  ```
*/

function TabbedPane() {
  Component.apply(this, arguments);
}

TabbedPane.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-tabbed-pane');
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
    }.bind(this));

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