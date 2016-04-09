"use strict";

var Component = require('./Component');
var ScrollPane = require('./ScrollPane');
var Icon = require('./FontAwesomeIcon');

function TOCPanel() {
  Component.apply(this, arguments);
}

TOCPanel.Prototype = function() {

  this.didMount = function() {
    var toc = this.context.toc;
    toc.on('toc:updated', this.onTOCUpdated, this);
  };

  this.dispose = function() {
    var toc = this.context.toc;
    toc.off(this);
  };

  this.render = function($$) {
    var toc = this.context.toc;
    var activeEntry = toc.activeEntry;

    var tocEntries = $$("div")
      .addClass("se-toc-entries")
      .ref('tocEntries');

    var entries = toc.getEntries();
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var level = entry.level;

      var tocEntryEl = $$('a')
        .addClass('se-toc-entry')
        .addClass('sm-level-'+level)
        .attr({
          href: "#",
          "data-id": entry.id,
        })
        .ref(entry.id)
        .on('click', this.handleClick)
        .append(
          $$(Icon, {icon: 'fa-caret-right'}),
          entry.name
        );
      if (activeEntry === entry.id) {
        tocEntryEl.addClass("sm-active");
      }
      tocEntries.append(tocEntryEl);
    }

    var el = $$('div').addClass('sc-toc-panel').append(
      $$(ScrollPane).ref('panelEl').append(
        tocEntries
      )
    );
    return el;
  };

  this.getDocument = function() {
    return this.context.doc;
  };

  this.onTOCUpdated = function() {
    this.rerender();
  };

  this.handleClick = function(e) {
    var nodeId = e.currentTarget.dataset.id;
    e.preventDefault();
    this.send('tocEntrySelected', nodeId);
  };
};

Component.extend(TOCPanel);

module.exports = TOCPanel;
