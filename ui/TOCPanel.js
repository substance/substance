"use strict";

var _ = require('../util/helpers');
var Component = require('./Component');
var ScrollPane = require('./ScrollPane');
var $$ = Component.$$;
var Icon = require('./FontAwesomeIcon');

function TOCPanel() {
  Component.apply(this, arguments);

  var toc = this.context.toc;
  toc.connect(this, {
    'toc:updated': this.onTOCUpdated
  });
}

TOCPanel.Prototype = function() {
  this.getDocument = function() {
    return this.context.doc;
  };

  this.onTOCUpdated = function() {
    this.rerender();
  };

  this.dispose = function() {
    var toc = this.context.toc;
    toc.disconnect(this);
  };

  this.render = function() {
    var toc = this.context.toc;
    var activeEntry = toc.activeEntry;

    var tocEntries = $$("div")
      .addClass("se-toc-entries")
      .ref('tocEntries');

    _.each(toc.getEntries(), function(entry) {
      var level = entry.level;

      var tocEntryEl = $$('a')
        .addClass('se-toc-entry')
        .addClass('sm-level-'+level)
        .attr({
          href: "#",
          "data-id": entry.id,
        })
        .ref(entry.id)
        // TODO: Why does handleClick get bound to this.refs.panelEl and not this?
        // Seems that handlers will be bound to the parent, not the owner.
        .on('click', this.handleClick)
        .append(
          $$(Icon, {icon: 'fa-caret-right'}),
          entry.name
        );
      if (activeEntry === entry.id) {
        tocEntryEl.addClass("sm-active");
      }
      tocEntries.append(tocEntryEl);
    }, this);

    var el = $$('div').addClass('sc-toc-panel').append(
      $$(ScrollPane).ref('panelEl').append(
        tocEntries
      )
    );
    return el;
  };

  this.handleClick = function(e) {
    var nodeId = e.currentTarget.dataset.id;
    e.preventDefault();
    this.send('tocEntrySelected', nodeId);
  };
};

Component.extend(TOCPanel);

module.exports = TOCPanel;
