'use strict';

var each = require('lodash/collection/each');

/*
 * HTML converter for TableRow.
 */
module.exports = {

  type: 'table-section',

  matchElement: function(el) {
    return el.is('thead, tbody, tfoot');
  },

  import: function(el, tableSection, converter) {
    var tagName = el.tagName;
    var sectionType = tagName.substring(1);
    tableSection.sectionType = sectionType;
    tableSection.rows = [];
    each(el.find('tr'), function(rowEl) {
      var rowNode = converter.convertElement(rowEl);
      rowNode.parent = tableSection.id;
      tableSection.rows.push(rowNode.id);
    });
  },

  export: function(section, el, converter) {
    el.tagName = 't' + section.sectionType;
    each(section.getRows(), function(row) {
      el.append(converter.convertNode(row));
    });
  },

};
