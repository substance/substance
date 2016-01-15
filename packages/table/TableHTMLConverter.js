'use strict';

var each = require('lodash/collection/each');

/*
 * HTML converter for Table.
 */
module.exports = {

  type: 'table',
  tagName: 'table',

  import: function(el, table, converter) {
    // initialize sections
    table.sections = [];
    // either we find thead, tbody, tfoot
    // or we take the rows right away
    each(["thead", "tbody", "tfoot"], function(name) {
      var tsec = el.find(name);
      if (tsec) {
        var sectionNode = converter.convertElement(tsec);
        sectionNode.parent = table.id;
        table.sections.push(sectionNode.id);
      }
    });
    // if no section was found create a tbody section
    if (table.sections.length === 0) {
      var sectionNode = {
        id: converter.nextId('tbody'),
        parent: table.id,
        type: "table-section",
        sectionType: "body",
        rows: []
      };
      each(el.findAll('tr'), function(rowEl) {
        var rowNode = converter.convertElement(rowEl);
        rowNode.parent = sectionNode.id;
        sectionNode.rows.push(rowNode.id);
      });
      converter.createNode(sectionNode);
      table.sections.push(sectionNode.id);
    }
  },

  export: function(table, el, converter) {
    each(table.getSections(), function(sec) {
      el.append(converter.convertNode(sec));
    });
  },

};
