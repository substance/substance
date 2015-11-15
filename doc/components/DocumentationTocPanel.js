'use strict';

var oo = require('../../util/oo');
var TocPanel = require('../../ui/TocPanel');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var MemberContainerComponent = require('./MemberContainerComponent');
var NamespaceComponent = require('./NamespaceComponent');

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
    contentNodes.forEach(function(nsId) {
      var ns = doc.get(nsId);
      tocEntry = this.renderTocNode(ns);
      if (!tocEntry) {
        return;
      } else {
        tocEntries.append(tocEntry);
      }

      // get the namespace members in the same order as rendered in the NamespaceComponent
      var nsMembers = this._getNamespaceMembers(ns);
      nsMembers.forEach(function(member) {
        tocEntry = this.renderTocNode(member);
        if (!tocEntry) {
          return;
        } else {
          tocEntries.append(tocEntry);
        }
      }.bind(this));
    }.bind(this));

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

  this._getNamespaceMembers = function(ns) {
    var members = [];
    var config = this.context.config;
    NamespaceComponent.MEMBER_CATEGORIES.forEach(function(cat) {
      var catMembers = MemberContainerComponent.getCategoryMembers(config, ns, cat);
      members = members.concat(catMembers);
    });
    return members;
  };
};

oo.inherit(DocumentationTocPanel, TocPanel);

DocumentationTocPanel.contextId = "toc";
DocumentationTocPanel.icon = "fa-align-left";

module.exports = DocumentationTocPanel;

