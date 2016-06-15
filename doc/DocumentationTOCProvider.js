'use strict';

var TOCProvider = require('../ui/TOCProvider');
var each = require('lodash/forEach');

function DocumentationTOCProvider() {
  DocumentationTOCProvider.super.apply(this, arguments);
}

DocumentationTOCProvider.Prototype = function() {

  this.computeEntries = function() {
    var doc = this.getDocument();
    var config = this.config;

    var entries = [];
    var contentNodes = doc.get('body').nodes;

    contentNodes.forEach(function(nsId) {
      var ns = doc.get(nsId);
      entries.push({
        id: nsId,
        name: ns.name,
        level: 1,
        node: ns
      });

      each(ns.getMemberCategories(), function(cat) {
        var catMembers = ns.getCategoryMembers(cat, config);
        catMembers.forEach(function(catMember) {
          entries.push({
            id: catMember.id,
            name: catMember.name,
            level: 2,
            node: catMember
          });
        });
      });
    });
    return entries;
  };
};

TOCProvider.extend(DocumentationTOCProvider);

DocumentationTOCProvider.static.tocTypes = ['namespace', 'class', 'function', 'module'];

module.exports = DocumentationTOCProvider;
