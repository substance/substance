"use strict";

import Component from './Component'
import ScrollPane from './ScrollPane'
import Icon from './FontAwesomeIcon'

function TOC() {
  Component.apply(this, arguments);
}

TOC.Prototype = function() {

  this.didMount = function() {
    var tocProvider = this.context.tocProvider;
    tocProvider.on('toc:updated', this.onTOCUpdated, this);
  };

  this.dispose = function() {
    var tocProvider = this.context.tocProvider;
    tocProvider.off(this);
  };

  this.render = function($$) {
    var tocProvider = this.context.tocProvider;
    var activeEntry = tocProvider.activeEntry;

    var tocEntries = $$("div")
      .addClass("se-toc-entries")
      .ref('tocEntries');

    var entries = tocProvider.getEntries();
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

Component.extend(TOC);

export default TOC;
