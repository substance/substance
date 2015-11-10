'use strict';

var oo = require('../../util/oo');
var TocPanel = require('../../ui/TocPanel');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function DocumentationTocPanel() {
  TocPanel.apply(this, arguments);
}

DocumentationTocPanel.Prototype = function() {

  this.render = function() {
    var el = $$("div")
      .addClass("panel toc-panel-component sc-documentation-toc-panel");
    var tocEntries = $$("div")
      .addClass("toc-entries");

    var doc = this.getDocument();
    var contentNodes = doc.get('body').nodes;

    var tocEntry;
    var self = this;
    contentNodes.forEach(function(nsId) {
      var ns = doc.get(nsId);
      tocEntry = self.renderTocNode(ns);
      if (!tocEntry) {
        return;
      } else {
        tocEntries.append(tocEntry);
      }

      var nsMembers = doc.getMembers(ns);
      nsMembers.forEach(function(member) {
        tocEntry = self.renderTocNode(member);
        if (!tocEntry) {
          return;
        } else {
          tocEntries.append(tocEntry);
        }

        // we could, but should we?
        // if (member.type === "class" || member.type === "module") {
        //   var children = doc.getMembers(member);
        //   children.forEach(function(child) {
        //     tocEntry = self.renderTocNode(child);
        //     if (!tocEntry) {
        //       return;
        //     } else {
        //       tocEntries.append(tocEntry);
        //     }
        //   });
        // }
      });
    });



    el.append(tocEntries);
    return el;
  };

  this.renderTocNode = function(node) {
    if (node.isAbstract && this.context.config.skipAbstractClasses) {
      return;
    }
    if (node.isPrivate && this.context.config.skipPrivateMethods) {
      return;
    }
    var state = this.state;
    var level;
    var content;
    if (node.type === "namespace") {
      level = 1;
      content = node.id;
    } else if (node.type === "class" || node.type === "module" || node.type === "function") {
      level = 2;
      content = node.name;
    } else if (node.type === "method" || node.type === "property") {
      level = 3;
      content = node.name;
    }
    var tocEntry = $$('a')
      .addClass('toc-entry')
      .addClass('level-'+level)
      .attr({
        href: "#",
        "data-id": node.id,
      })
      .on('click', this.handleClick)
      .append(content);
    if (state.activeNode === node.id) {
      tocEntry.addClass("active");
    }
    return tocEntry;
  };

  this.handleClick = function(e) {
    e.preventDefault();
    var nodeId = e.currentTarget.dataset.id;
    this.send('extendState', {nodeId: nodeId});
  };

};

oo.inherit(DocumentationTocPanel, TocPanel);

DocumentationTocPanel.contextId = "toc";
DocumentationTocPanel.icon = "fa-align-left";

module.exports = DocumentationTocPanel;

