'use strict';

var $ = require('../../basics/jquery');
var _ = require('../../basics/helpers');
var DocumentNode = require('../node');
var ListItem = require('./list_item');
var ParentNodeMixin = require('../parent_node_mixin');

// Note: we have chosen a semi-hierarchical model for lists
// consisting of one list wrapper with many list items.
// Nesting and type information is stored on the items.
// This will make life easier for editing.
// The wrapping list node helps us to create a scope for rendering, and
// import/export.
var List = DocumentNode.extend(ParentNodeMixin.prototype, {
  displayName: "List",
  name: "list",
  properties: {
    ordered: "boolean",
    items: ["array", "id"]
  },
  didInitialize: function() {
    // call mix-in initializer
    ParentNodeMixin.call(this, 'items');
  },

  getItems: function() {
    var doc = this.getDocument();
    return _.map(this.items, function(id) {
      return doc.get(id);
    }, this);
  },

  removeItem: function(id) {
    var doc = this.getDocument();
    var offset = this.items.indexOf(id);
    if (offset >= 0) {
      doc.update([this.id, 'items'], { "delete": { offset: offset } });
    } else {
      throw new Error('List item is not a child of this list: ' + id);
    }
  },
  insertItemAt: function(offset, id) {
    var doc = this.getDocument();
    doc.update([this.id, 'items'], { "insert": { offset: offset, value: id } });
  },

});

List.static.components = ['items'];

// HtmlImporter

List.static.blockType = true;

List.static.matchElement = function($el) {
  return $el.is('ul,ol');
};

/**
 *
 * <ol>
 *   <li>Item 1
 *     <ul>
 *       <li>Point A</li>
 *       <li>Point B</li>
 *     </ul>
 *   </li>
 *   <li>Item 2
 *     <ul>
 *       <li>Point C</li>
 *       <li>Point D</li>
 *     </ul>
 *   </li>
 * </ol>
 *
 * Will be modeled as:
 *
 * list:
 *   - list-item[1,o,"Item 1"]
 *   - list-item[2,u,"Point A"]
 *   - list-item[2,u,"Point B"]
 *   - list-item[1,o,"Item 2"]
 *   - list-item[2,u,"Point A"]
 *   - list-item[2,u,"Point B"]
 */

List.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'list');
  var list = {
    id: id,
    items: []
  };
  // iterate through the children keeping track of the nesting level
  // and associate a list type
  var level = 0;
  var types = [];

  // TODO: this needs to be fleshed out to be 100% robust
  function _normalizeListItem(converter, li) {
    var segments = [[]];
    var last = segments[0];
    for(var child=li.firstChild; child; child = child.nextSibling) {
      var type = converter._getDomNodeType(child);
      if (type === "ol" || type === "ul") {
        last = child;
        segments.push(last);
      } else {
        if (/^\s*$/.exec($(child).text())) {
          // skip fragments with only whitespace
          continue;
        }
        if (!_.isArray(last)) {
          last = [];
          segments.push(last);
        }
        last.push(child);
      }
    }
    return segments;
  }

  function _convertListItem(li) {
    var ordered = (_.last(types) === "ol");
    // in our interpretation a list item may have leading annotated text
    // and trailing list element
    var fragments = _normalizeListItem(converter, li);
    for (var i = 0; i < fragments.length; i++) {
      var fragment = fragments[i];
      if (_.isArray(fragment)) {
        // create a list item and use the fragment as annotated content
        var $wrapper = $('<span>').append(fragment);
        converter.trimTextContent($wrapper);
        var listItem = ListItem.static.fromHtml($wrapper, converter);
        listItem.ordered = ordered;
        listItem.level = level;
        converter.getDocument().create(listItem);
        list.items.push(listItem.id);
      } else {
        _convertList(fragment);
      }
    }
  }

  function _convertList(listEl) {
    level++;
    types.push(converter._getDomNodeType(listEl));
    for (var child = listEl.firstChild; child; child = child.nextSibling) {
      var type = converter._getDomNodeType(child);
      if (type === "li") {
        _convertListItem(child);
      } else if (type == "ol" || type === "ul") {
        _convertList(child);
      }
    }
    level--;
    types.pop();
  }
  _convertList($el[0]);

  return list;
};

List.static.toHtml = function(list, converter) {
  return List.static.render(list, {
    createElement: function(tagName) {
      return $('<' + tagName + '>');
    },
    createAnnotatedTextNode: function(path) {
      return converter.annotatedText(path);
    },
  });
};

List.static.render = function(list, impl) {
  var tagName = list.ordered ? 'ol' : 'ul';
  var id = list.id;
  var children = list.getItems();
  var el = impl.createElement(tagName);
  el.attr('data-id', id);

  var j;
  var current = el;
  var stack = [current];
  var level = 1;

  for (var i = 0; i < children.length; i++) {
    var item = children[i];
    if (item.level === level) {
      // nothing to change
    } else if (item.level > level) {
      // push structure
      var _tagName = item.ordered ? 'ol' : 'ul';
      for (j = level; j < item.level; j++) {
        // create a list element and wrap it into a 'li'
        var listEl = impl.createElement(_tagName);
        current.append(listEl);
        // update level and stack
        current = listEl;
        stack.push(current);
        level++;
      }
    } else /* if (item.level < level) */ {
      // pop structure
      for (j = level; j > item.level; j--) {
        stack.pop();
        level--;
      }
      current = stack[stack.length-1];
    }
    current.append(impl.createElement('li')
      .addClass("content-node list-item")
      .attr("data-id", item.id)
      .append(
        impl.createAnnotatedTextNode([item.id, "content"])
      )
    );
  }
  return el;
};

Object.defineProperties(List.prototype, {
  itemNodes: {
    'get': function() {
      return this.getItems();
    }
  }
});

module.exports = List;
